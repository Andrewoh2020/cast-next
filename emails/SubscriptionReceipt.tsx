import {
  Html, Head, Body, Container, Section, Text,
  Row, Column, Hr, Font,
} from '@react-email/components';

interface Props {
  tier: 'starter' | 'studio' | 'pro' | 'free';
  monthlyCredits: number;
  amountPaid: string;
  amountCents: number; // 0 means "no charge today" — hides Total Charged row
  orderId: string;
  purchaseDate: string;
  renewalDate: string | null;
  kind: 'new' | 'renewal' | 'switch' | 'downgrade' | 'cancel-scheduled' | 'cancel-final';
  // Only used for kind='switch' / 'downgrade' / 'cancel-final'
  fromTier?: 'starter' | 'studio' | 'pro';
  proratedCreditsAdded?: number;
}

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Cast Starter',
  studio: 'Cast Studio',
  pro: 'Cast Pro',
};

const HEADLINE_COLOR: Record<Props['kind'], string> = {
  new: '#16a34a',
  renewal: '#16a34a',
  switch: '#16a34a',
  downgrade: '#6b7280',
  'cancel-scheduled': '#d97706',
  'cancel-final': '#6b7280',
};

const HEADLINE: Record<Props['kind'], string> = {
  new: 'Subscription Active',
  renewal: 'Subscription Renewed',
  switch: 'Plan Switched',
  downgrade: 'Plan Downgrade Scheduled',
  'cancel-scheduled': 'Cancellation Scheduled',
  'cancel-final': 'Subscription Ended',
};

export default function SubscriptionReceipt({
  tier,
  monthlyCredits,
  amountPaid,
  amountCents,
  orderId,
  purchaseDate,
  renewalDate,
  kind,
  fromTier,
  proratedCreditsAdded,
}: Props) {
  const tierName = TIER_LABEL[tier] ?? tier;
  const fromName = fromTier ? (TIER_LABEL[fromTier] ?? fromTier) : null;
  const headline = HEADLINE[kind];
  const headlineColor = HEADLINE_COLOR[kind];
  const showCharge = amountCents > 0;

  let subheadline: string;
  switch (kind) {
    case 'new':
      subheadline = `Welcome to ${tierName}. ${monthlyCredits.toLocaleString()} credits have been added to your account, and you'll get the same allowance every month.`;
      break;
    case 'switch':
      subheadline = `${fromName ? `You switched from ${fromName} to ${tierName}.` : `You switched to ${tierName}.`} ${proratedCreditsAdded ? `${proratedCreditsAdded.toLocaleString()} prorated credits have been added now, and you'll get the full ${monthlyCredits.toLocaleString()}-credit allowance at next renewal.` : `Your new ${monthlyCredits.toLocaleString()}-credit monthly allowance kicks in at next renewal.`}`;
      break;
    case 'renewal':
      subheadline = `Your ${tierName} subscription renewed. ${monthlyCredits.toLocaleString()} credits have been added for this billing period.`;
      break;
    case 'downgrade':
      subheadline = `${fromName ? `You're switching from ${fromName} to ${tierName}.` : `You're switching to ${tierName}.`} No charge today — your current allowance stays in place${renewalDate ? ` until ${renewalDate}` : ''}, then your new ${monthlyCredits.toLocaleString()}-credit/mo allowance takes over.`;
      break;
    case 'cancel-scheduled':
      subheadline = `Your ${tierName} plan stays active${renewalDate ? ` until ${renewalDate}` : ' through the end of this billing cycle'}. After that, you'll drop to Free with daily drip credits. You can change your mind anytime by picking any paid plan.`;
      break;
    case 'cancel-final':
      subheadline = `Your ${fromName ?? tierName} subscription has ended. You're now on Free — 10 credits per day, capped at 25. Come back anytime by picking a paid plan.`;
      break;
  }

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

          <Section style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: '#000', margin: 0 }}>
              CAST
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
              AI Character Licensing
            </Text>
          </Section>

          <Section style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: '28px 32px',
            border: '1px solid #e5e7eb',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: headlineColor, margin: '0 0 6px' }}>
              {headline}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: '#000', margin: '0 0 4px' }}>
              {tierName}
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', margin: '0 0 0', lineHeight: '1.5' }}>
              {subheadline}
            </Text>
          </Section>

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
                <Text style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Plan</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 13, color: '#111', margin: 0 }}>{tierName} ({monthlyCredits.toLocaleString()} cr/mo)</Text>
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
            {renewalDate && (
              <Row style={{ marginBottom: 8 }}>
                <Column>
                  <Text style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Next renewal</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: 13, color: '#111', margin: 0 }}>{renewalDate}</Text>
                </Column>
              </Row>
            )}
            <Row style={{ marginBottom: 8 }}>
              <Column>
                <Text style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Order ID</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontFamily: 'monospace' }}>{orderId}</Text>
              </Column>
            </Row>
            {showCharge && (
              <>
                <Hr style={{ borderColor: '#e5e7eb', margin: '12px 0' }} />
                <Row>
                  <Column>
                    <Text style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>Total Charged</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' }}>
                    <Text style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: 0 }}>{amountPaid} USD</Text>
                  </Column>
                </Row>
              </>
            )}
            <Text style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 0', textAlign: 'center' }}>
              {showCharge
                ? <>Charged by Cast (Ability AI Technologies Pte Ltd, Singapore UEN 202548889G).<br/>Manage or cancel your subscription anytime from your account.</>
                : <>No charge today. Manage your subscription anytime from <a href="https://www.castability.ai/pricing" style={{ color: '#6366f1', textDecoration: 'none' }}>castability.ai/pricing</a>.</>}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '8px 0 20px' }} />

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
