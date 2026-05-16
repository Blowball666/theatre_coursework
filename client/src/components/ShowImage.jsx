export default function ShowImage({ src, alt, className, style }) {
  if (src) {
    const imgSrc = src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`;
    return <img src={imgSrc} alt={alt} className={className} style={style} />;
  }
  return (
    <div className={`img-placeholder ${className || ''}`} style={style} />
  );
}
