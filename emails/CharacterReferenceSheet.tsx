import {
  Html, Head, Body, Container, Section, Text, Img,
  Row, Column, Hr, Button, Font,
} from '@react-email/components';
import {
  Talent,
  SEX_LABELS, AGE_LABELS, BUILD_LABELS, HEIGHT_LABELS,
  RACE_LABELS,
} from '@/lib/talent';

interface Props {
  talent: Talent;
  licenseName: string;
  licensePrice: string;
  referenceSheetDownloadUrl?: string;
  profilePhotoDownloadUrl?: string;
  baseUrl?: string;
}

export default function CharacterReferenceSheet({
  talent,
  licenseName,
  licensePrice,
  referenceSheetDownloadUrl,
  profilePhotoDownloadUrl,
  baseUrl = 'https://www.castability.ai',
}: Props) {
  const attrs = [
    { label: 'Sex', value: SEX_LABELS[talent.sex] },
    { label: 'Age Range', value: AGE_LABELS[talent.ageRange] },
    { label: 'Build', value: BUILD_LABELS[talent.build] },
    { label: 'Height', value: HEIGHT_LABELS[talent.height] },
    { label: 'Race', value: (talent.race || []).map((r) => RACE_LABELS[r]).join(', ') || '—' },
    { label: 'Ethnicity', value: talent.ethnicity || '—' },
  ];

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

          {/* License confirmation card */}
          <Section style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: '28px 32px',
            border: '1px solid #e5e7eb',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#6366f1', margin: '0 0 6px' }}>
              License Confirmed
            </Text>
            <Text style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: '#000', margin: '0 0 4px' }}>
              {talent.name}
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px', lineHeight: '1.5' }}>
              {talent.vibe}
            </Text>

            {/* License badge */}
            <Section style={{
              backgroundColor: '#eef2ff',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
            }}>
              <Row>
                <Column>
                  <Text style={{ fontSize: 12, fontWeight: 700, color: '#4338ca', margin: 0 }}>
                    {licenseName} License
                  </Text>
                  <Text style={{ fontSize: 11, color: '#6366f1', margin: '2px 0 0' }}>
                    Commercial &amp; broadcast rights included · One-time fee
                  </Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ fontSize: 22, fontWeight: 900, color: '#000', margin: 0 }}>
                    {licensePrice}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Character image */}
            {talent.img && (
              <Section style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}>
                <Img
                  src={talent.img.startsWith('http') ? talent.img : `${baseUrl}${talent.img}`}
                  alt={talent.name}
                  width={536}
                  style={{ width: '100%', borderRadius: 12, display: 'block' }}
                />
              </Section>
            )}

            {/* Attributes grid */}
            <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#9ca3af', margin: '0 0 12px' }}>
              Character Profile
            </Text>
            {attrs.map((attr, i) => (
              i % 2 === 0 ? (
                <Row key={attr.label} style={{ marginBottom: 8 }}>
                  <Column style={{ backgroundColor: '#f9fafb', borderRadius: 10, padding: '10px 14px', width: '48%' }}>
                    <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 2px', letterSpacing: '1px' }}>{attr.label}</Text>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{attr.value}</Text>
                  </Column>
                  {attrs[i + 1] && (
                    <Column style={{ backgroundColor: '#f9fafb', borderRadius: 10, padding: '10px 14px', width: '48%', marginLeft: '4%' }}>
                      <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 2px', letterSpacing: '1px' }}>{attrs[i + 1].label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>{attrs[i + 1].value}</Text>
                    </Column>
                  )}
                </Row>
              ) : null
            ))}
          </Section>

          {/* Asset downloads */}
          {(profilePhotoDownloadUrl || referenceSheetDownloadUrl) && (
            <Section style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: '24px 32px',
              border: '1px solid #e5e7eb',
              marginBottom: 20,
              textAlign: 'center',
            }}>
              <Text style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>
                Your Assets are Ready
              </Text>
              <Text style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
                Download your character profile photo and reference sheet to start generating.
              </Text>
              {profilePhotoDownloadUrl && (
                <Section style={{ marginBottom: 10 }}>
                  <Button
                    href={profilePhotoDownloadUrl}
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
              'Full-resolution character reference sheets',
              'Commercial & broadcast license',
              'Style guide & color palette',
              'Copyright clearance certificate',
            ].map((item) => (
              <Row key={item} style={{ marginBottom: 8 }}>
                <Column style={{ width: 24 }}>
                  <Text style={{ fontSize: 13, color: '#10b981', fontWeight: 700, margin: 0 }}>✓</Text>
                </Column>
                <Column>
                  <Text style={{ fontSize: 13, color: '#374151', margin: 0 }}>{item}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '8px 0 20px' }} />

          {/* Footer */}
          <Section style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>
              Questions or feedback? Email us at <a href="mailto:admin@castability.ai" style={{ color: '#6366f1', textDecoration: 'none' }}>admin@castability.ai</a>
            </Text>
            <Text style={{ fontSize: 11, color: '#d1d5db', margin: 0 }}>
              © 2026 Cast · AI Character Licensing
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
