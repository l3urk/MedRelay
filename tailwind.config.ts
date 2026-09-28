import type {Config} from 'tailwindcss';
const config: Config = {content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],theme:{extend:{fontFamily:{sans:['Inter','ui-sans-serif','system-ui']},colors:{ink:'#102033',mint:'#19b394',mist:'#f5faf8',line:'#dce9e5'}}},plugins:[]}; export default config;
