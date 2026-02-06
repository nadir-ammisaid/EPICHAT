const DICEBEAR_STYLE = "lorelei";
const getRandomAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;

export default getRandomAvatar;