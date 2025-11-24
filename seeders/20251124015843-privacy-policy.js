"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert(
      "PrivacyPolicies",
      [
        {
          version: "1.0.0",
          title: "Privacy Policy",
          content: `
# Privacy Policy

**Effective Date:** ${now.toLocaleDateString()}

## 1. Introduction

Welcome to our Privacy Policy. Your privacy is critically important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.

## 2. Information We Collect

### Personal Information
We may collect personal information that you voluntarily provide to us when you:
- Register on the service
- Express an interest in obtaining information about us or our products and services
- Participate in activities on the service
- Contact us

Personal information may include:
- Name
- Email address
- Phone number
- Profile information
- Contact preferences

### Automatically Collected Information
When you access our service, we may automatically collect certain information about your device, including:
- IP address
- Browser type and version
- Time zone setting
- Browser plug-in types and versions
- Operating system and platform
- Usage data and analytics

### Cookies and Tracking Technologies
We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.

## 3. How We Use Your Information

We use the information we collect or receive:
- To provide, operate, and maintain our service
- To improve, personalize, and expand our service
- To understand and analyze how you use our service
- To develop new products, services, features, and functionality
- To communicate with you for customer service, updates, and promotional purposes
- To process your transactions
- To send you administrative information
- To enforce our terms, conditions, and policies
- To respond to legal requests and prevent harm
- For fraud monitoring and prevention

## 4. How We Share Your Information

We may share your information in the following situations:
- **With Service Providers:** We may share your information with third-party service providers who perform services on our behalf
- **For Business Transfers:** In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business
- **With Your Consent:** We may disclose your personal information for any other purpose with your consent
- **Legal Requirements:** If required to do so by law or in response to valid requests by public authorities

## 5. Data Retention

We will retain your personal information only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your information to comply with our legal obligations, resolve disputes, and enforce our agreements.

## 6. Data Security

We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.

### Security Measures Include:
- Encryption of data in transit and at rest
- Regular security assessments
- Access controls and authentication
- Secure data centers
- Employee training on data protection

## 7. Your Privacy Rights

Depending on your location, you may have the following rights:
- **Right to Access:** You can request copies of your personal data
- **Right to Rectification:** You can request correction of inaccurate data
- **Right to Erasure:** You can request deletion of your personal data
- **Right to Restrict Processing:** You can request restriction of processing your personal data
- **Right to Data Portability:** You can request transfer of your data
- **Right to Object:** You can object to our processing of your personal data
- **Right to Withdraw Consent:** You can withdraw your consent at any time

To exercise these rights, please contact us using the information provided below.

## 8. Third-Party Links

Our service may contain links to third-party websites. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.

## 9. Children's Privacy

Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.

## 10. International Data Transfers

Your information may be transferred to and maintained on computers located outside of your country where data protection laws may differ. By using our service, you consent to this transfer.

## 11. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date."

## 12. Contact Us

If you have any questions about this Privacy Policy, please contact us:
- Email: privacy@example.com
- Phone: +1 (555) 123-4567
- Address: 123 Privacy Street, City, Country

---

**Last Updated:** ${now.toLocaleDateString()}
          `.trim(),
          effectiveDate: now,
          isActive: true,
          lastModifiedBy: "System Administrator",
          changesSummary: "Initial version of Privacy Policy",
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("PrivacyPolicies", null, {});
  },
};
