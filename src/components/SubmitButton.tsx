'use client'

import React from 'react';
import { useFormStatus } from 'react-dom'; // hook React pour status du form
import ActionButton from '@/components/ui/ActionButton';

export default function SubmitButton({ children, variant }: { children: React.ReactNode; variant?: any }) {
  const status = useFormStatus() as { pending: boolean } | null
  const pending = status?.pending ?? false

  return (
    <ActionButton type="submit" loading={pending} variant={variant} >
      {children}
    </ActionButton>
  )
}
