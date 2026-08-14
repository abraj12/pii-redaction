import { HelpCircle, FileUp, ShieldAlert, Download } from 'lucide-react';

export default function Help() {
  const faqs = [
    {
      q: "What file formats are supported?",
      a: "Currently, we support PDF (.pdf), Microsoft Word (.docx), and Plain Text (.txt) files up to 50MB in size."
    },
    {
      q: "How does the redaction process work?",
      a: "When you upload a document, we extract the text (using OCR for images/scanned PDFs) and pass it through our AI-powered NLP engine. It detects entities like Names, Emails, and Phone Numbers, and securely masks them with placeholder values."
    },
    {
      q: "Is my data stored securely?",
      a: "Yes. All uploaded documents are processed securely. Registered users have their data stored for 30 days before automatic deletion. Guest session data is deleted within 24 hours."
    },
    {
      q: "Why is the extraction failing on my DOCX?",
      a: "Complex DOCX files with heavily nested XML structures (like tables inside textboxes) can take longer to process. Our system automatically falls back to raw XML parsing to ensure no data is lost."
    }
  ];

  return (
    <div className="max-w-[800px] mx-auto py-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#11133A]">Help & Documentation</h1>
        <p className="text-gray-500 text-sm mt-1">Learn how to use the PII Redaction Tool securely and efficiently.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-sm">
          <FileUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-sm mb-1">1. Upload</h3>
          <p className="text-xs text-gray-500">Upload any PDF, DOCX, or TXT file.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-sm">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-sm mb-1">2. Process</h3>
          <p className="text-xs text-gray-500">Our AI scans and detects sensitive data.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-sm">
          <Download className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-sm mb-1">3. Download</h3>
          <p className="text-xs text-gray-500">Download the safely redacted document.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-gray-500" />
          <h2 className="font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, i) => (
            <div key={i} className="p-6">
              <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
