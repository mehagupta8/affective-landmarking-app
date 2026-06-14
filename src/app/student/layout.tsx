'use client'

import { ReactNode } from 'react'
import { StudentAuthGuard } from '@/components/auth/StudentAuthGuard'

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentAuthGuard>{children}</StudentAuthGuard>
}
