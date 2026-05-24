// Base44 integrations এর স্থানীয় বিকল্প
// এই ফাংশনগুলো অ্যাপে ব্যবহার হলে stub হিসেবে কাজ করবে

export const InvokeLLM = async () => { throw new Error('LLM integration not available in local mode'); };
export const SendEmail = async () => { throw new Error('Email integration not available in local mode'); };
export const SendSMS = async () => { throw new Error('SMS integration not available in local mode'); };
export const GenerateImage = async () => { throw new Error('Image generation not available in local mode'); };
export const ExtractDataFromUploadedFile = async () => { throw new Error('Not available in local mode'); };

// UploadFile - ফাইল আপলোড লোকালে হবে না, base64 হিসেবে ফেরত দেবে
export const UploadFile = async ({ file }) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ file_url: e.target.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const Core = { InvokeLLM, SendEmail, SendSMS, UploadFile, GenerateImage, ExtractDataFromUploadedFile };
