export default function Privacy() {
  return (
    <div className="max-w-[800px] mx-auto py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-[#11133A] mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Data Collection & Processing</h2>
            <p>
              When you use the PII Redaction Tool, we process the documents you upload solely for the purpose of identifying and redacting Personally Identifiable Information. 
              We do not use your documents to train machine learning models, nor do we sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Data Retention</h2>
            <p>
              <strong>For Guest Users:</strong> All uploaded documents, extracted text, and generated redaction reports are securely deleted within 24 hours of upload.
            </p>
            <p className="mt-2">
              <strong>For Registered Users:</strong> We retain your processed documents and reports for a standard period of 30 days to allow you to review and download them later. 
              You can manually delete your data at any time from your Dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Data Security</h2>
            <p>
              We implement industry-standard security measures to ensure your sensitive documents are protected both in transit and at rest. 
              The extraction and processing occur in sandboxed environments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
