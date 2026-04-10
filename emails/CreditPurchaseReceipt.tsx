import {
  Html, Head, Body, Container, Section, Text,
  Row, Column, Hr, Font,
} from '@react-email/components';

interface Props {
  credits: number;
  amountPaid: string;
  orderId: string;
  purchaseDate: string;
  packageLabel: string;
}

export default function CreditPurchaseReceipt({
  credits,
  amountPaid,
  orderId,
  purchaseDate,
  packageLabel,
}: Props) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body style={{ backgroundColor: '#f9fafb', margin: 0, padding: 0, fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>

          {/* Header */}
          <Section style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: '#000', margin: 0 }}>
              CAST
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
              AI Character Licensing
            </Text>
          </Section>

          {/* Confirmation card */}
          <Section style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: '28px 32px',
            border: '1px solid #e5e7eb',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#16a34a', margin: '0 0 6px' }}>
              Payment Confirmed
            </Text>
            <Text style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: '#000', margin: '0 0 4px' }}>
              {credits} Character {credits === 1 ? 'Credit' : 'Credits'} Added
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', margin: '0 0 0', lineHeight: '1.5' }}>
              Your credits are ready. Use them anytime to generate custom AI characters with hi-res profile photos and 8-panel reference sheets.
            </Text>
          </Section>

          {/* Receipt */}
          <Section style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: '24px 32px',
            border: '1px solid #e5e7eb',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#9ca3af', margin: '0 0 16px' }}>
              Receipt
            </Text>
            <Row style={{ marginBottom: 8 }}>
              <Column>
                <Text style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Item</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 13, color: '#111', margin: 0 }}>{packageLabel}</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: 8 }}>
              <Column>
                <Text style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Date</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 13, color: '#111', margin: 0 }}>{purchaseDate}</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: 8 }}>
              <Column>
                <Text style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Order ID</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontFamily: 'monospace' }}>{orderId}</Text>
              </Column>
            </Row>
            <Hr style={{ borderColor: '#e5e7eb', margin: '12px 0' }} />
            <Row>
              <Column>
                <Text style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>Total Paid</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: 0 }}>{amountPaid} USD</Text>
              </Column>
            </Row>
            <Text style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 0', textAlign: 'center' }}>
              Charged by Cast (Ability AI Technologies Pte Ltd, Singapore UEN 202548889G).
              <br/>Save this email for your records and expense reporting.
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '8px 0 20px' }} />

          {/* Footer */}
          <Section style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>
              Questions or feedback? Email us at <a href="mailto:admin@castability.ai" style={{ color: '#6366f1', textDecoration: 'none' }}>admin@castability.ai</a>
            </Text>
            <Text style={{ fontSize: 11, color: '#d1d5db', margin: 0 }}>
              &copy; 2026 Cast &middot; AI Character Licensing
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
