/**
 * Generates an authenticated URL for viewing documents online inside the browser.
 * Routes through the CampusTrack backend API with the active JWT query token,
 * which delivers Content-Disposition: inline and Content-Type: application/pdf / image/*
 * to prevent browsers from automatically downloading the file.
 */
export const getDocumentViewUrl = (documentId?: string): string => {
  if (!documentId) return '#';
  const token = localStorage.getItem('campustrack_token');
  if (token) {
    return `/api/v1/documents/${documentId}?token=${encodeURIComponent(token)}`;
  }
  return `/api/v1/documents/${documentId}`;
};

/**
 * Generates an authenticated URL for EXPLICITLY DOWNLOADING a document.
 * Sets query parameter download=true so the backend sends Content-Disposition: attachment,
 * prompting the browser to save the file to disk.
 */
export const getDocumentDownloadUrl = (documentId?: string): string => {
  if (!documentId) return '#';
  const token = localStorage.getItem('campustrack_token');
  if (token) {
    return `/api/v1/documents/${documentId}?token=${encodeURIComponent(token)}&download=true`;
  }
  return `/api/v1/documents/${documentId}?download=true`;
};

/**
 * Resolves any document reference (Document object, ObjectId, Cloudinary URL, or local path) into
 * an authenticated INLINE PREVIEW URL that opens inside the browser viewer.
 */
export const resolveDocumentViewUrl = (linkOrId?: any, documentsList?: any[]): string => {
  if (!linkOrId) return '#';

  // If passed a document object
  if (typeof linkOrId === 'object') {
    if (linkOrId._id) return getDocumentViewUrl(linkOrId._id);
    if (linkOrId.id) return getDocumentViewUrl(linkOrId.id);
    if (linkOrId.cloudinarySecureUrl) linkOrId = linkOrId.cloudinarySecureUrl;
    else return '#';
  }

  const str = String(linkOrId);

  // External non-Cloudinary links (e.g., Google Drive) open directly
  if (str.startsWith('http') && !str.includes('cloudinary.com')) {
    return str;
  }

  // If already an API documents URL, ensure token is attached
  if (str.includes('/api/v1/documents/')) {
    const id = str.split('/api/v1/documents/')[1]?.split('?')[0];
    return getDocumentViewUrl(id);
  }

  // If it's a Cloudinary URL, look up the document ID in the provided documents list
  if (str.includes('cloudinary.com') && documentsList && documentsList.length > 0) {
    const found = documentsList.find(
      (d: any) => 
        d.cloudinarySecureUrl === str || 
        d.cloudinaryUrl === str || 
        (d.documentType === 'resume' && str.includes('resumes'))
    );
    if (found && found._id) {
      return getDocumentViewUrl(found._id);
    }
    // Extract filename / public_id as fallback ID for backend lookup
    const lastSegment = str.split('/').pop()?.split('?')[0];
    if (lastSegment) {
      return getDocumentViewUrl(lastSegment);
    }
  }

  // Default: treat input as document ID
  return getDocumentViewUrl(str);
};

/**
 * Resolves any document reference into an EXPLICIT DOWNLOAD URL.
 */
export const resolveDocumentDownloadUrl = (linkOrId?: any, documentsList?: any[]): string => {
  if (!linkOrId) return '#';

  if (typeof linkOrId === 'object') {
    if (linkOrId._id) return getDocumentDownloadUrl(linkOrId._id);
    if (linkOrId.id) return getDocumentDownloadUrl(linkOrId.id);
    if (linkOrId.cloudinarySecureUrl) linkOrId = linkOrId.cloudinarySecureUrl;
    else return '#';
  }

  const str = String(linkOrId);

  if (str.startsWith('http') && !str.includes('cloudinary.com')) {
    return str;
  }

  if (str.includes('/api/v1/documents/')) {
    const id = str.split('/api/v1/documents/')[1]?.split('?')[0];
    return getDocumentDownloadUrl(id);
  }

  if (str.includes('cloudinary.com') && documentsList && documentsList.length > 0) {
    const found = documentsList.find(
      (d: any) => 
        d.cloudinarySecureUrl === str || 
        d.cloudinaryUrl === str || 
        (d.documentType === 'resume' && str.includes('resumes'))
    );
    if (found && found._id) {
      return getDocumentDownloadUrl(found._id);
    }
    const lastSegment = str.split('/').pop()?.split('?')[0];
    if (lastSegment) {
      return getDocumentDownloadUrl(lastSegment);
    }
  }

  return getDocumentDownloadUrl(str);
};
