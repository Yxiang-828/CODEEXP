import React from 'react';
import { useAppAuth } from '@/lib/authContext.jsx';
import CivilianHome from './CivilianHome';
import ResponderHome from './ResponderHome';
import OperationsHome from './OperationsHome';

export default function HomePage() {
  const { currentUser } = useAppAuth();
  const role = currentUser?.active_role || 'civilian';

  if (role === 'responder') return <ResponderHome />;
  if (role === 'operations') return <OperationsHome />;
  return <CivilianHome />;
}