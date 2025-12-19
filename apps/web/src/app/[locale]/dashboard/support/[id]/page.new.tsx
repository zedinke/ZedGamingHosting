'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TicketComment {
  id: string;
  message: string;
  author: {
    id: string;
    email: string;
  };
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  category?: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Support Ticket #{ticketId}</h1>
      <p className="text-gray-600">Support ticket detail view under development</p>
    </div>
  );
}
