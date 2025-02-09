import { ChakraProvider } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import PageTransition from '../components/PageTransition'
import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '../components/CartContext'

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
    const router = useRouter()

    useEffect(() => {
        // This ensures hydration matches
        const handleRouteChange = () => {
            const htmlElement = document.querySelector('html')
            if (htmlElement) {
                htmlElement.style.scrollBehavior = 'auto'
            }
        }

        router.events.on('routeChangeStart', handleRouteChange)

        return () => {
            router.events.off('routeChangeStart', handleRouteChange)
        }
    }, [router])

    return (
        <SessionProvider session={session}>
            <ChakraProvider>
                <CartProvider>
                    <PageTransition>
                        <Component {...pageProps} />
                    </PageTransition>
                </CartProvider>
            </ChakraProvider>
        </SessionProvider>
    )
}

export default MyApp 