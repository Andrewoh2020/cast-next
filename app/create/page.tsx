import { Metadata } from 'next';
import CreateClient from '@/components/create/CreateClient';

export const metadata: Metadata = {
  title: 'Create Your Own Character',
  description: 'Design and generate your own AI character for film and video production. Describe, preview, and download — powered by AI.',
};

export default function CreatePage() {
  // Auth is checked at the Generate click in DescribeStep, not page load
  // This lets guests see the form and fill it out before signing up
  return <CreateClient />;
}
