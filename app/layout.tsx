import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'MedRelay — Close the refill gap',description:'Refill coordination for pharmacies and provider organizations.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
