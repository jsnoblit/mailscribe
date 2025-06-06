import TestScreenshots from '@/components/debug/TestScreenshots';

export default function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Screenshot Testing</h1>
      <TestScreenshots />
    </div>
  );
}
