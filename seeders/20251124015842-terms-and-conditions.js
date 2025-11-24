"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert(
      "TermsAndConditions",
      [
        {
          version: "1.0.0",
          title: "Terms and Conditions",
          content: `
# Terms and Conditions

**Effective Date:** ${now.toLocaleDateString()}

## 1. Acceptance of Terms

By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License

Permission is granted to temporarily download one copy of the materials (information or software) on our service for personal, non-commercial transitory viewing only.

### This license shall automatically terminate if you violate any of these restrictions:
- You may not modify or copy the materials
- You may not use the materials for any commercial purpose
- You may not attempt to decompile or reverse engineer any software
- You may not remove any copyright or other proprietary notations

## 3. User Account

When you create an account with us, you must provide accurate, complete, and up-to-date information. Failure to do so constitutes a breach of the Terms.

You are responsible for:
- Safeguarding the password you use to access the service
- Any activities or actions under your password
- Notifying us immediately upon becoming aware of any breach of security

## 4. Intellectual Property

The service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

## 5. User-Generated Content

Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material. You are responsible for the content you post.

## 6. Prohibited Uses

You may not use our service:
- For any unlawful purpose
- To solicit others to perform or participate in any unlawful acts
- To violate any international, federal, provincial or state regulations, rules, laws, or local ordinances
- To infringe upon or violate our intellectual property rights or the intellectual property rights of others
- To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate
- To submit false or misleading information

## 7. Limitation of Liability

In no event shall we, nor our directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.

## 8. Disclaimer

Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis.

## 9. Governing Law

These Terms shall be governed and construed in accordance with applicable laws, without regard to its conflict of law provisions.

## 10. Changes to Terms

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes.

## 11. Contact Information

If you have any questions about these Terms, please contact us at support@example.com.

---

**Last Updated:** ${now.toLocaleDateString()}
          `.trim(),
          effectiveDate: now,
          isActive: true,
          lastModifiedBy: "System Administrator",
          changesSummary: "Initial version of Terms and Conditions",
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("TermsAndConditions", null, {});
  },
};
