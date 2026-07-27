export function InvestorReceiptUploadForm({ investorId, enquiryId }: { investorId: string; enquiryId: string }) {
  return (
    <form action="/api/admin/investor-receipts" method="post" encType="multipart/form-data" className="grid gap-3 rounded-md border border-stone-200 bg-stone-50 p-3">
      <input type="hidden" name="investorId" value={investorId} />
      <input type="hidden" name="investorEnquiryId" value={enquiryId} />
      <h3 className="text-sm font-black">Upload Transaction Receipt</h3>
      <label className="field">
        <span className="label">Amount</span>
        <input className="input" name="amount" type="number" min="0" step="0.01" placeholder="0.00" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span className="label">Currency</span>
          <input className="input" name="currency" defaultValue="GBP" maxLength={3} />
        </label>
        <label className="field">
          <span className="label">Date</span>
          <input className="input" name="transactionDate" type="date" />
        </label>
      </div>
      <label className="field">
        <span className="label">Receipt file</span>
        <input className="input" name="receipt" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
      </label>
      <label className="field">
        <span className="label">Notes</span>
        <textarea className="input min-h-20" name="notes" />
      </label>
      <button className="btn btn-primary" type="submit">Upload Receipt</button>
    </form>
  );
}
