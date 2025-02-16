const processLandImages = (lands) => {
  return lands.map(land => ({
    ...land,
    landImages: land.landImages.map(img => ({
      ...img,
      data: img.data.toString('base64')
    }))
  }));
};

const handleEmailNotification = async (emailData) => {
  try {
    await transporter.sendMail(emailData);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

module.exports = { processLandImages, handleEmailNotification };