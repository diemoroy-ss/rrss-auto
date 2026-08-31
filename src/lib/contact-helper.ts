/**
 * Utilidad para formatear y anexar datos de contacto de la empresa a los copys.
 */

export interface BusinessContactData {
  name?: string;
  businessName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  instagramUsername?: string;
  facebookPageName?: string;
  tiktokUsername?: string;
  xUsername?: string;
  includePhoneInCopy?: boolean;
  includeEmailInCopy?: boolean;
  includeWebsiteInCopy?: boolean;
}

export function formatBusinessContactLines(profile?: BusinessContactData | null): string[] {
  if (!profile) return [];

  const parts: string[] = [];
  
  const showPhone = profile.includePhoneInCopy !== false && (profile.whatsapp || profile.phone);
  const showWeb = profile.includeWebsiteInCopy !== false && profile.website;
  const showEmail = profile.includeEmailInCopy !== false && profile.email;

  const phoneVal = (profile.whatsapp || profile.phone || "").trim();
  if (showPhone && phoneVal) {
    parts.push(`📲 WhatsApp / Tel: ${phoneVal}`);
  }

  const webVal = (profile.website || "").trim();
  if (showWeb && webVal) {
    const formattedWeb = webVal.startsWith('http') ? webVal : `https://${webVal}`;
    parts.push(`🌐 Web: ${formattedWeb}`);
  }

  const emailVal = (profile.email || "").trim();
  if (showEmail && emailVal) {
    parts.push(`📧 Email: ${emailVal}`);
  }

  const addrVal = (profile.address || "").trim();
  if (addrVal) {
    parts.push(`📍 Ubicación: ${addrVal}`);
  }

  return parts;
}

export function appendContactInfo(baseText: string, profile?: BusinessContactData | null): string {
  if (!baseText) return "";
  if (!profile) return baseText.trim();

  const contactLines = formatBusinessContactLines(profile);
  if (contactLines.length === 0) return baseText.trim();

  const lowerText = baseText.toLowerCase();

  // Filtrar las líneas que no estén ya mencionadas en el texto para no duplicar
  const missingLines: string[] = [];
  
  const phoneVal = (profile.whatsapp || profile.phone || "").trim().toLowerCase();
  const webVal = (profile.website || "").trim().toLowerCase();
  const emailVal = (profile.email || "").trim().toLowerCase();

  for (const line of contactLines) {
    if (line.includes('WhatsApp') && phoneVal && lowerText.includes(phoneVal)) {
      continue;
    }
    if (line.includes('Web') && webVal && (lowerText.includes(webVal) || lowerText.includes(webVal.replace('https://', '').replace('http://', '')))) {
      continue;
    }
    if (line.includes('Email') && emailVal && lowerText.includes(emailVal)) {
      continue;
    }
    missingLines.push(line);
  }

  if (missingLines.length === 0) {
    return baseText.trim();
  }

  return `${baseText.trim()}\n\n${missingLines.join('\n')}`;
}
