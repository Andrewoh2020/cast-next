import {
  Html, Head, Body, Container, Section, Text,
  Row, Column, Hr, Button, Font,
} from '@react-email/components';

interface Props {
  characterName: string;
  description: string;
  profileDownloadUrl?: string;
  referenceSheetDownloadUrl?: string;
  accountUrl: string;
  baseUrl?: string;
}

export default function CustomCharacterReceipt({
  characterName,
  description,
  profileDownloadUrl,
  referenceSheetDownloadUrl,
  accountUrl,
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
              AI Character Creation
            </Text>
          </Section>

          {/* Receipt card */}
          <Section style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: '28px 32px',
            border: '1px solid #e5e7eb',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#16a34a', margin: '0 0 6px' }}>
              Character Ready
            </Text>
            <Text style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: '#000', margin: '0 0 4px' }}>
              {characterName}
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px', lineHeight: '1.5' }}>
              {description}
            </Text>

            {/* Purchase summary */}
            <Section style={{
              backgroundColor: '#f0fdf4',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
            }}>
              <Row>
                <Column>
                  <Text style={{ fontSize: 12, fontWeight: 700, color: '#166534', margin: 0 }}>
                    Custom Character Package
                  </Text>
                  <Text style={{ fontSize: 11, color: '#16a34a', margin: '2px 0 0' }}>
                    Hi-res profile + 8-panel reference sheet + commercial license
                  </Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: 22, fontWeight: 900, color: '#000', margin: 0 }}>
                    1 credit
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Download section */}
          {(profileDownloadUrl || referenceSheetDownloadUrl) && (
            <Section style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: '24px 32px',
              border: '1px solid #e5e7eb',
              marginBottom: 20,
              textAlign: 'center',
            }}>
              <Text style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>
                Download Your Assets
              </Text>
              <Text style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
                Your character assets are ready. Click below to download.
              </Text>
              {profileDownloadUrl && (
                <Section style={{ marginBottom: 10 }}>
                  <Button
                    href={profileDownloadUrl}
                    style={{
                      backgroundColor: '#6366f1',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      padding: '12px 28px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Download Profile Photo
                  </Button>
                </Section>
              )}
              {referenceSheetDownloadUrl && (
                <Section>
                  <Button
                    href={referenceSheetDownloadUrl}
                    style={{
                      backgroundColor: '#111',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      padding: '12px 28px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Download Reference Sheet
                  </Button>
                </Section>
              )}
            </Section>
          )}

          {/* What's included */}
          <Section style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: '24px 32px',
            border: '1px solid #e5e7eb',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#9ca3af', margin: '0 0 12px' }}>
              What&apos;s Included
            </Text>
            {[
              'Hi-resolution profile photo (4K)',
              '8-panel character reference sheet',
              'Full ownership of the character',
              'Commercial license — rights persist after cancellation',
            ].map((item) => (
              <Row key={item} style={{ marginBottom: 8 }}>
                <Column style={{ width: 24 }}>
                  <Text style={{ fontSize: 13, color: '#10b981', fontWeight: 700, margin: 0 }}>&#10003;</Text>
                </Column>
                <Column>
                  <Text style={{ fontSize: 13, color: '#374151', margin: 0 }}>{item}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Account link */}
          <Section style={{ textAlign: 'center', marginBottom: 20 }}>
            <Button
              href={accountUrl}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontWeight: 600,
                fontSize: 13,
                padding: '10px 24px',
                borderRadius: 10,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View in My Account
            </Button>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '8px 0 20px' }} />

          {/* Footer */}
          <Section style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>
              Questions or feedback? Email us at <a href="mailto:admin@castability.ai" style={{ color: '#6366f1', textDecoration: 'none' }}>admin@castability.ai</a>
            </Text>
            <Text style={{ fontSize: 11, color: '#d1d5db', margin: 0 }}>
              &copy; 2026 Cast &middot; AI Character Creation
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
