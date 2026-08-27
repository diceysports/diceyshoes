import './globals.css';import Header from '../components/Header';import Footer from '../components/Footer';import {StoreProvider} from '../components/StoreProvider';
export const metadata={title:'Dicey Shoes',description:'Sneakers, luxury footwear and release culture.'};
export default function RootLayout({children}){return <html lang="en"><body><StoreProvider><Header/>{children}<Footer/></StoreProvider></body></html>}
