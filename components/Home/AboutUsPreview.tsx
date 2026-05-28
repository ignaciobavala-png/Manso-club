import { getAboutUs } from '@/lib/aboutUs';
import { AboutUsPreviewClient } from './AboutUsPreviewClient';

export const AboutUsPreview = async () => {
  const about = await getAboutUs();
  const paragraphs = about.description
    .split('\n')
    .filter(p => p.trim());

  return (
    <AboutUsPreviewClient
      subtitle={about.subtitle}
      paragraphs={paragraphs}
      mainPhotoUrl={about.main_photo_url ?? null}
    />
  );
};
