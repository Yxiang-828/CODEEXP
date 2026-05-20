import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import {
  AlertTriangle, MapPin, Mic, MicOff, FileText, Camera,
  ChevronRight, ChevronDown, Loader2, Check, X, Send } from
'lucide-react';
import { Button } from '@/components/ui/button';

const EVENT_TYPES = [
{ key: 'emergency', label: 'Emergency', emoji: '🚨', desc: 'Fire, flood, medical, accident, hazard' },
{ key: 'volunteering', label: 'Volunteering', emoji: '🤝', desc: 'Community support & volunteer activity' }];


const EMERGENCY_SUBTYPES = [
{ key: 'fire', label: 'Fire', emoji: '🔥' },
{ key: 'flood', label: 'Flood', emoji: '🌊' },
{ key: 'medical', label: 'Health / Medical', emoji: '🚑' },
{ key: 'accident', label: 'Traffic Accident', emoji: '🚗' },
{ key: 'hazard', label: 'Hazard', emoji: '⚠️' }];


const STEPS = ['type', 'details', 'review'];

export default function ReportTab({ userLocation }) {
  const { currentUser } = useAppAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // 'voice' | 'form'
  const [step, setStep] = useState('type');
  const [eventType, setEventType] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [details, setDetails] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Voice mode
  const [recording, setRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceParsed, setVoiceParsed] = useState(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const fileInputRef = useRef(null);

  // --- Voice recording ---
  const startRecording = async () => {
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await processVoiceBlob(blob);
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const processVoiceBlob = async (blob) => {
    setVoiceLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
    const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
    setVoiceTranscript(transcript);
    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract emergency report details from this voice note: "${transcript}"
Return a JSON with: title (short title), category (one of: fire, flood, medical, accident, hazard, other), description (clean summary), severity (low/medium/high/critical).`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          severity: { type: 'string' }
        }
      }
    });
    setVoiceParsed(parsed);
    setVoiceLoading(false);
  };

  const submitVoiceReport = async () => {
    if (!voiceParsed) return;
    setSubmitting(true);
    await base44.entities.Emergency.create({
      title: voiceParsed.title,
      category: voiceParsed.category || 'other',
      severity: voiceParsed.severity || 'medium',
      description: voiceParsed.description,
      reporter_name: currentUser?.display_name,
      reporter_phone: currentUser?.phone,
      status: 'reported',
      latitude: userLocation?.lat,
      longitude: userLocation?.lng,
      address: userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : ''
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  // --- Form mode submit ---
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submitFormReport = async () => {
    setSubmitting(true);
    let image_url = '';
    if (photoFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      image_url = file_url;
    }
    if (eventType === 'emergency') {
      await base44.entities.Emergency.create({
        title: subtype ? `${EMERGENCY_SUBTYPES.find((s) => s.key === subtype)?.label} Emergency` : 'Emergency Report',
        category: subtype === 'flood' ? 'natural_disaster' : subtype === 'hazard' ? 'infrastructure' : subtype || 'other',
        severity: 'medium',
        description: details,
        reporter_name: currentUser?.display_name,
        reporter_phone: currentUser?.phone,
        status: 'reported',
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
        address: userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : '',
        image_url
      });
    } else {
      await base44.entities.VolunteerEvent.create({
        title: 'Volunteer Report',
        description: details,
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        location: userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Singapore',
        organizer: currentUser?.display_name,
        status: 'upcoming'
      });
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  // --- Success screen ---
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-gray-800 mb-2">Report Submitted</h2>
        <p className="text-gray-500 text-sm mb-6">Help is on the way. Stay safe and keep this app open for updates.</p>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8" onClick={() => {setSubmitted(false);setMode(null);setStep('type');setEventType(null);setSubtype(null);setDetails('');setPhotoFile(null);setPhotoPreview(null);setVoiceTranscript('');setVoiceParsed(null);}}>
          Submit Another
        </Button>
      </div>);

  }

  // --- Mode selection ---
  if (!mode) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 w-full">
        {/* SOS banner */}
        







        

        <h2 className="font-heading text-xl font-bold text-gray-800 mb-1">SOS / Report</h2>
        <p className="text-gray-500 text-sm mb-6">Choose how you'd like to submit your report</p>

        <div className="space-y-4">
          {/* Voice mode */}
          <button
            onClick={() => setMode('voice')}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-5 text-left hover:border-red-400 transition-all group">
            
            <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mic className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-base text-gray-800">🎙️ Voice Note</p>
              <p className="text-xs text-gray-500 mt-0.5">Speak your emergency — AI will extract and prepare the report for you</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto shrink-0" />
          </button>

          {/* Form mode */}
          <button
            onClick={() => setMode('form')}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 text-left hover:border-blue-400 transition-all group">
            
            <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-base text-gray-800">📋 Fill Out Form</p>
              <p className="text-xs text-gray-500 mt-0.5">Select event type, add details and a photo, then review before submitting</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto shrink-0" />
          </button>
        </div>

        {/* Location */}
        


        
      </div>);

  }

  // --- VOICE MODE ---
  if (mode === 'voice') {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 w-full">
        <button onClick={() => setMode(null)} className="flex items-center gap-1 text-xs text-gray-500 mb-5 hover:text-gray-700">
          <X className="w-3.5 h-3.5" /> Back
        </button>
        <h2 className="font-heading text-xl font-bold text-gray-800 mb-1">🎙️ Voice Report</h2>
        <p className="text-gray-500 text-sm mb-6">Press and hold the mic, describe what you see. AI will process it.</p>

        {/* Mic button */}
        <div className="flex flex-col items-center gap-5 mb-6">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-lg transition-all ${recording ? 'bg-red-500 scale-110 shadow-red-300' : 'bg-gray-800 hover:bg-gray-700'}`}>
            
            {recording ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
            <span className="text-white text-xs mt-1 font-semibold">{recording ? 'Release' : 'Hold to Record'}</span>
          </button>
          {recording && <p className="text-red-500 text-sm font-semibold animate-pulse">● Recording…</p>}
        </div>

        {voiceLoading &&
        <div className="flex flex-col items-center gap-2 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">AI is processing your voice note…</p>
          </div>
        }

        {voiceTranscript && !voiceLoading &&
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Transcript</p>
            <p className="text-sm text-gray-700 italic">"{voiceTranscript}"</p>
          </div>
        }

        {voiceParsed && !voiceLoading &&
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 mb-5 space-y-2">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Report Preview</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500 text-xs">Title:</span><p className="font-semibold text-gray-800">{voiceParsed.title}</p></div>
              <div><span className="text-gray-500 text-xs">Category:</span><p className="font-semibold text-gray-800 capitalize">{voiceParsed.category}</p></div>
              <div><span className="text-gray-500 text-xs">Severity:</span><p className="font-semibold text-gray-800 capitalize">{voiceParsed.severity}</p></div>
            </div>
            <div><span className="text-gray-500 text-xs">Description:</span><p className="text-sm text-gray-700 mt-0.5">{voiceParsed.description}</p></div>
          </div>
        }

        {voiceParsed && !voiceLoading &&
        <button
          onClick={submitVoiceReport}
          disabled={submitting}
          className="w-full h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
          
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {submitting ? 'Submitting…' : '🆘 Submit SOS Report'}
          </button>
        }
      </div>);

  }

  // --- FORM MODE ---
  return (
    <div className="max-w-lg mx-auto px-4 py-6 w-full">
      <button onClick={() => {setMode(null);setStep('type');setEventType(null);setSubtype(null);}} className="flex items-center gap-1 text-xs text-gray-500 mb-4 hover:text-gray-700">
        <X className="w-3.5 h-3.5" /> Back
      </button>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) =>
        <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === s ? 'text-blue-600' : STEPS.indexOf(step) > i ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s ? 'border-blue-500 bg-blue-500 text-white' : STEPS.indexOf(step) > i ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-400'}`}>
                {STEPS.indexOf(step) > i ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:inline capitalize">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${STEPS.indexOf(step) > i ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        )}
      </div>

      {/* STEP 1: Type */}
      {step === 'type' &&
      <div>
          <h3 className="font-bold text-base text-gray-800 mb-4">What type of event?</h3>
          <div className="space-y-3 mb-6">
            {EVENT_TYPES.map((t) =>
          <button
            key={t.key}
            onClick={() => setEventType(t.key)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${eventType === t.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            
                <span className="text-3xl">{t.emoji}</span>
                <div>
                  <p className="font-bold text-sm text-gray-800">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
                {eventType === t.key && <Check className="w-5 h-5 text-blue-500 ml-auto shrink-0" />}
              </button>
          )}
          </div>

          {eventType === 'emergency' &&
        <div className="mb-6">
              <p className="font-semibold text-sm text-gray-700 mb-3">Select emergency type:</p>
              <div className="grid grid-cols-2 gap-2">
                {EMERGENCY_SUBTYPES.map((s) =>
            <button
              key={s.key}
              onClick={() => setSubtype(s.key)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${subtype === s.key ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
              
                    <span className="text-xl">{s.emoji}</span>
                    {s.label}
                  </button>
            )}
              </div>
            </div>
        }

          <Button
          className="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold"
          disabled={!eventType || eventType === 'emergency' && !subtype}
          onClick={() => setStep('details')}>
          
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      }

      {/* STEP 2: Details */}
      {step === 'details' &&
      <div>
          <h3 className="font-bold text-base text-gray-800 mb-4">Add details</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">What's happening? <span className="text-red-500">*</span></label>
              <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the situation in as much detail as possible…"
              rows={4}
              className="w-full rounded-2xl border-2 border-gray-200 p-4 text-sm focus:outline-none focus:border-blue-400 resize-none bg-white" />
            
            </div>

            {/* Photo attach */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Attach Photo (optional)</label>
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
              {photoPreview ?
            <div className="relative rounded-2xl overflow-hidden border-2 border-blue-300">
                  <img src={photoPreview} alt="preview" className="w-full h-40 object-cover" />
                  <button onClick={() => {setPhotoFile(null);setPhotoPreview(null);}} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div> :

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all">
              
                  <Camera className="w-5 h-5" />
                  <span className="text-sm font-medium">Tap to take or upload photo</span>
                </button>
            }
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={() => setStep('type')}>Back</Button>
            <Button className="flex-1 h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold" disabled={!details.trim()} onClick={() => setStep('review')}>
              Review <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      }

      {/* STEP 3: Review */}
      {step === 'review' &&
      <div>
          <h3 className="font-bold text-base text-gray-800 mb-4">Review Your Report</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{eventType === 'emergency' ? '🚨' : '🤝'}</span>
              <div>
                <p className="font-bold text-sm text-gray-800">{eventType === 'emergency' ? `${EMERGENCY_SUBTYPES.find((s) => s.key === subtype)?.label} Emergency` : 'Volunteering Report'}</p>
                <p className="text-xs text-gray-500 capitalize">{eventType}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Details</p>
              <p className="text-sm text-gray-700">{details}</p>
            </div>
            {photoPreview &&
          <img src={photoPreview} alt="Attached" className="w-full h-32 object-cover rounded-xl" />
          }
            <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 ${userLocation ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {userLocation ? `Live location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'No location'}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={() => setStep('details')}>Edit</Button>
            <button
            onClick={submitFormReport}
            disabled={submitting}
            className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-base">
            
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {submitting ? 'Submitting…' : '🆘 SOS Submit'}
            </button>
          </div>
        </div>
      }
    </div>);

}