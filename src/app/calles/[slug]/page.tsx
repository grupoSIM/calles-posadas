import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStreetBySlug } from '@/lib/db/streets';
import StreetDetailView from '@/components/street/StreetDetailView';

import { getStreetMetadata } from '@/lib/metadata';

interface StreetPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: StreetPageProps) {
  const { slug } = await props.params;
  return getStreetMetadata(slug);
}

export default async function StreetDetailPage(props: StreetPageProps) {
  const { slug } = await props.params;
  const street = getStreetBySlug(slug);

  if (!street) {
    notFound();
  }

  return <StreetDetailView street={street} />;
}
