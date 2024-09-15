/**
 * Get the base64 from image url
 * @param url
 * @returns
 */
// eslint-disable-next-line no-async-promise-executor
const getBase64Image = (url: string) => new Promise<any>(async (resolve) => {
  try {
    const data = await fetch(url);
    const blob = await data.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  } catch {
    resolve('');
  }
});

export default getBase64Image;
