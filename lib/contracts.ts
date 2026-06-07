import { currency, date } from "./format";

export interface ContractFields {
  type: string;
  buyerName?: string | null;
  sellerName?: string | null;
  propertyAddress?: string | null;
  purchasePrice?: number | null;
  assignmentFee?: number | null;
  earnestMoney?: number | null;
  closingDate?: Date | string | null;
  inspectionDays?: number | null;
}

/**
 * Generate boilerplate contract text. These are educational templates, not
 * legal advice — always have an attorney review before use.
 */
export function generateContractBody(f: ContractFields): string {
  if (f.type === "assignment") return assignmentAgreement(f);
  if (f.type === "jv") return jvAgreement(f);
  if (f.type === "option") return optionAgreement(f);
  return purchaseAgreement(f);
}

function purchaseAgreement(f: ContractFields): string {
  return `REAL ESTATE PURCHASE AND SALE AGREEMENT

This Purchase and Sale Agreement ("Agreement") is entered into as of ${date(new Date())} by and between:

SELLER: ${f.sellerName || "[SELLER NAME]"}
BUYER: ${f.buyerName || "[BUYER NAME]"} and/or assigns

1. PROPERTY. Seller agrees to sell and Buyer agrees to buy the real property located at:
   ${f.propertyAddress || "[PROPERTY ADDRESS]"} (the "Property").

2. PURCHASE PRICE. The total purchase price is ${currency(f.purchasePrice) || "[PRICE]"}.

3. EARNEST MONEY. Buyer shall deposit ${currency(f.earnestMoney) || "$10"} as earnest money to be
   held in escrow and applied to the purchase price at closing.

4. INSPECTION PERIOD. Buyer shall have ${f.inspectionDays ?? 10} days from the effective date to
   inspect the Property. Buyer may terminate this Agreement for any reason during this period
   and the earnest money shall be refunded.

5. CLOSING. Closing shall occur on or before ${date(f.closingDate) || "[CLOSING DATE]"} at a title
   company or closing attorney selected by Buyer.

6. ASSIGNMENT. This Agreement and the rights herein are freely assignable by Buyer without
   the consent of Seller.

7. TITLE. Seller shall convey marketable title by general warranty deed, free of liens.

8. CLOSING COSTS. Each party shall pay their customary closing costs unless otherwise agreed.

IN WITNESS WHEREOF, the parties have executed this Agreement.

SELLER: _______________________________   DATE: ____________
        ${f.sellerName || "[SELLER NAME]"}

BUYER:  _______________________________   DATE: ____________
        ${f.buyerName || "[BUYER NAME]"}

DISCLAIMER: This template is for educational purposes only and is not legal advice.
Consult a licensed attorney in your jurisdiction before use.`;
}

function assignmentAgreement(f: ContractFields): string {
  return `ASSIGNMENT OF REAL ESTATE PURCHASE AND SALE AGREEMENT

This Assignment Agreement ("Assignment") is made as of ${date(new Date())} between:

ASSIGNOR: ${f.sellerName || "[ASSIGNOR / WHOLESALER]"}
ASSIGNEE: ${f.buyerName || "[ASSIGNEE / END BUYER]"}

1. ASSIGNMENT. Assignor hereby assigns and transfers all of its rights, title, and interest in
   that certain Purchase and Sale Agreement for the property located at
   ${f.propertyAddress || "[PROPERTY ADDRESS]"} (the "Contract") to Assignee.

2. ASSIGNMENT FEE. In consideration of this Assignment, Assignee shall pay Assignor an
   assignment fee of ${currency(f.assignmentFee) || "[ASSIGNMENT FEE]"}, due at closing.

3. ASSUMPTION. Assignee assumes all obligations of the Buyer under the Contract and agrees to
   perform all terms, including the purchase price of ${currency(f.purchasePrice) || "[PRICE]"}.

4. CLOSING. The transaction shall close on or before ${date(f.closingDate) || "[CLOSING DATE]"}.

5. NON-PERFORMANCE. If Assignee fails to close, the earnest money and assignment fee may be
   forfeited and Assignor retains all rights under the original Contract.

IN WITNESS WHEREOF, the parties have executed this Assignment.

ASSIGNOR: _______________________________   DATE: ____________
          ${f.sellerName || "[ASSIGNOR]"}

ASSIGNEE: _______________________________   DATE: ____________
          ${f.buyerName || "[ASSIGNEE]"}

DISCLAIMER: This template is for educational purposes only and is not legal advice.
Consult a licensed attorney in your jurisdiction before use.`;
}

function jvAgreement(f: ContractFields): string {
  return `JOINT VENTURE AGREEMENT

This Joint Venture Agreement is made as of ${date(new Date())} between
${f.sellerName || "[PARTY A]"} and ${f.buyerName || "[PARTY B]"} for the purpose of
wholesaling the property located at ${f.propertyAddress || "[PROPERTY ADDRESS]"}.

1. PURPOSE. The parties agree to jointly market and assign the Property contract and to split
   the resulting assignment fee of ${currency(f.assignmentFee) || "[FEE]"} as follows: 50% / 50%
   unless otherwise agreed in writing.

2. RESPONSIBILITIES. Each party shall use commercially reasonable efforts to close the deal.

3. DISTRIBUTION. Proceeds shall be distributed at closing through the title company.

PARTY A: _______________________________   DATE: ____________
PARTY B: _______________________________   DATE: ____________

DISCLAIMER: Educational template only — not legal advice.`;
}

function optionAgreement(f: ContractFields): string {
  return `OPTION TO PURCHASE REAL ESTATE

This Option Agreement is made as of ${date(new Date())} between
${f.sellerName || "[OWNER]"} ("Owner") and ${f.buyerName || "[OPTIONEE]"} ("Optionee").

1. GRANT OF OPTION. Owner grants Optionee the exclusive option to purchase the property at
   ${f.propertyAddress || "[PROPERTY ADDRESS]"} for ${currency(f.purchasePrice) || "[PRICE]"}.

2. OPTION CONSIDERATION. Optionee pays ${currency(f.earnestMoney) || "$100"} for this option.

3. OPTION PERIOD. The option may be exercised on or before ${date(f.closingDate) || "[DATE]"}.

OWNER:    _______________________________   DATE: ____________
OPTIONEE: _______________________________   DATE: ____________

DISCLAIMER: Educational template only — not legal advice.`;
}
