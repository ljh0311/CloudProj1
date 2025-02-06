import { Box, Container, Heading, Text, SimpleGrid, Icon, Flex, VStack, Button } from '@chakra-ui/react';
import Head from 'next/head';
import { motion, useAnimation } from 'framer-motion';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import AnimatedBackground from '../components/AnimatedBackground';
import { FaLeaf, FaTshirt, FaHeart, FaGlobe, FaRandom } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

const funFacts = [
    "Our youngest team member started thrifting at age 13! 🎒",
    "We've rescued over 500 vintage tees from being forgotten! 👕",
    "Our logo was designed on a napkin during lunch! 🎨",
    "We once found a rare 1980s concert tee in a $2 bin! 💎",
    "Our team has collectively visited over 200 thrift stores! 🏪",
    "The name 'KAPPY' came from a 3 AM brainstorming session! ✨",
    "We've turned down $1000 offers for some of our rarest finds! 💰",
    "Our first sale was to a customer who's now our team member! 🤝",
    "We photograph all our items while dancing to 80s music! 📸",
    "Our office plant is named after a vintage brand! 🌿"
];

const values = [
    {
        icon: FaTshirt,
        title: "Curated Vintage",
        description: "Each piece in our collection is carefully selected for its unique character and style, ensuring quality and authenticity."
    },
    {
        icon: FaLeaf,
        title: "Climate Conscious",
        description: "We focus on breathable, comfortable pieces that are perfect for Singapore's tropical weather."
    },
    {
        icon: FaHeart,
        title: "Youth Culture",
        description: "Our style speaks to the bold, expressive spirit of Singapore's youth street culture."
    },
    {
        icon: FaGlobe,
        title: "Sustainable Fashion",
        description: "By curating vintage pieces, we promote sustainable fashion and reduce environmental impact."
    }
];

export default function About() {
    const [randomFact, setRandomFact] = useState(funFacts[0]);
    const controls = useAnimation();

    const getRandomFact = async () => {
        await controls.start({ opacity: 0, y: 20 });
        setRandomFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
        await controls.start({ opacity: 1, y: 0 });
    };

    useEffect(() => {
        controls.start({ opacity: 1, y: 0 });
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    };

    return (
        <>
            <Head>
                <title>About KAPPY | Vintage Streetwear Singapore</title>
                <meta name="description" content="KAPPY brings curated vintage streetwear to Singapore's youth culture, combining bold style with climate-conscious fashion." />
            </Head>

            <Box
                as="main"
                bg="black"
                color="white"
                minH="100vh"
                position="relative"
                overflow="hidden"
            >
                <AnimatedBackground />

                <Box
                    position="relative"
                    zIndex="1"
                    backdropFilter="blur(5px)"
                >
                    <Navbar />

                    <Container maxW="container.xl" py={12}>
                        <MotionBox
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Brand Story Section */}
                            <MotionBox
                                textAlign="center"
                                maxW="800px"
                                mx="auto"
                                mb={12}
                                variants={itemVariants}
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Logo size="100px" />
                                </motion.div>
                                <MotionHeading as="h1" size="2xl" mt={6} mb={4} variants={itemVariants}>
                                    Our Story
                                </MotionHeading>
                                <MotionText fontSize="xl" color="whiteAlpha.800" mb={6} variants={itemVariants}>
                                    Where Vintage Meets Street Culture
                                </MotionText>
                                <MotionText color="whiteAlpha.700" fontSize="lg" lineHeight="tall" variants={itemVariants}>
                                    KAPPY was founded by three passionate teenagers in Singapore who shared a common frustration - wanting to be fashionable while dealing with the city's hot and humid climate.
                                    What started as their personal quest to find stylish yet breathable vintage pieces has grown into a curated collection that helps other young Singaporeans express themselves
                                    without compromising on comfort.
                                </MotionText>
                            </MotionBox>

                            {/* Fun Fact Section */}
                            <MotionBox 
                                textAlign="center" 
                                maxW="800px" 
                                mx="auto" 
                                mb={12} 
                                variants={itemVariants}
                            >
                                <MotionHeading as="h2" size="xl" mb={6}>
                                    Random Fun Fact
                                </MotionHeading>
                                <MotionBox
                                    animate={controls}
                                    initial={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.5 }}
                                    bg="rgba(255, 255, 255, 0.1)"
                                    p={6}
                                    borderRadius="lg"
                                    backdropFilter="blur(8px)"
                                    borderWidth="1px"
                                    borderColor="rgba(255, 255, 255, 0.2)"
                                    mb={4}
                                >
                                    <Text fontSize="xl" color="white">
                                        {randomFact}
                                    </Text>
                                </MotionBox>
                                <Button
                                    leftIcon={<FaRandom />}
                                    onClick={getRandomFact}
                                    bg="white"
                                    color="black"
                                    _hover={{ bg: 'whiteAlpha.800' }}
                                    size="lg"
                                >
                                    Show Another Fact
                                </Button>
                            </MotionBox>

                            {/* Values Grid */}
                            <MotionBox width="100%" mb={12} variants={itemVariants}>
                                <MotionHeading as="h2" size="xl" mb={8} textAlign="center">
                                    What We Stand For
                                </MotionHeading>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                                    {values.map((value, index) => (
                                        <MotionBox
                                            key={index}
                                            variants={itemVariants}
                                            whileHover={{ scale: 1.02 }}
                                            p={6}
                                            borderWidth="1px"
                                            borderColor="rgba(255, 255, 255, 0.2)"
                                            borderRadius="lg"
                                            bg="rgba(0, 0, 0, 0.6)"
                                            backdropFilter="blur(8px)"
                                        >
                                            <Flex align="center" width="100%" mb={4}>
                                                <Icon as={value.icon} boxSize={6} color="white" mr={3} />
                                                <Heading size="md">{value.title}</Heading>
                                            </Flex>
                                            <Text color="whiteAlpha.800">
                                                {value.description}
                                            </Text>
                                        </MotionBox>
                                    ))}
                                </SimpleGrid>
                            </MotionBox>

                            {/* Community Section */}
                            <MotionBox textAlign="center" maxW="800px" mx="auto" variants={itemVariants}>
                                <MotionHeading as="h2" size="xl" mb={6}>
                                    Join Our Community
                                </MotionHeading>
                                <MotionText color="whiteAlpha.700" fontSize="lg" lineHeight="tall">
                                    KAPPY is more than just a brand – it's a community of style enthusiasts who appreciate the unique character of vintage
                                    fashion and its place in modern street culture. Whether you're new to vintage fashion or a seasoned collector,
                                    you'll find your place here.
                                </MotionText>
                            </MotionBox>
                        </MotionBox>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 