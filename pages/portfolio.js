import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Progress as ChakraProgress,
    SimpleGrid,
    Badge,
    Tooltip,
    HStack,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Icon,
    Grid,
} from '@chakra-ui/react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTools, FaClock } from 'react-icons/fa';

const MotionBox = motion(Box);

// Implementation progress data
const initialFeatures = [
    {
        feature: "Homepage",
        description: "Main landing page with brand introduction and featured sections",
        details: [
            "Brand showcase ✓",
            "Hero section ✓",
            "Feature cards ✓",
            "Responsive design ✓",
            "Pending: Final content review"
        ]
    },
    {
        feature: "Shop Page",
        description: "Product listing and filtering functionality",
        details: [
            "Product grid ✓",
            "Search functionality ✓",
            "Filters ✓",
            "Pending: Backend integration",
            "Pending: Shopping cart"
        ]
    },
    {
        feature: "Product Details",
        description: "Individual product view and purchase functionality",
        details: [
            "Product display ✓",
            "Image gallery ✓",
            "Pending: Size selection",
            "Pending: Add to cart",
            "Pending: Reviews section"
        ]
    },
    {
        feature: "Authentication",
        description: "User authentication and account management",
        details: [
            "Login form ✓",
            "Form validation ✓",
            "Registration form ✓",
            "Pending: Password recovery",
            "Pending: Social login"
        ]
    },
    {
        feature: "About Page",
        description: "Brand story and mission statement",
        details: [
            "Brand story ✓",
            "Mission statement ✓",
            "Values section ✓",
            "Animations ✓",
            "Pending: Content review"
        ]
    },
    {
        feature: "Shopping Cart",
        description: "Cart functionality and checkout process",
        details: [
            "Cart UI design ✓",
            "Pending: Add/Remove items",
            "Pending: Price calculation",
            "Pending: Checkout process",
            "Pending: Payment integration"
        ]
    }
];

export default function DevelopmentProgress() {
    const [implementationProgress, setImplementationProgress] = useState([]);
    const [summary, setSummary] = useState({
        totalFeatures: 0,
        completedFeatures: 0,
        averageProgress: 0,
    });

    // Function to calculate progress and status
    const calculateProgress = (details) => {
        const totalItems = details.length;
        const completedItems = details.filter(item => item.includes('✓')).length;
        const progress = Math.round((completedItems / totalItems) * 100);
        
        let status;
        if (progress >= 90) status = "Near Completion";
        else if (progress >= 70) status = "In Progress";
        else if (progress >= 40) status = "In Development";
        else status = "Planning";

        return { progress, status };
    };

    // Update progress and calculate summary
    useEffect(() => {
        const updatedProgress = initialFeatures.map(feature => {
            const { progress, status } = calculateProgress(feature.details);
            return {
                ...feature,
                progress,
                status
            };
        });
        
        // Calculate summary statistics
        const totalFeatures = updatedProgress.length;
        const completedFeatures = updatedProgress.filter(f => f.progress >= 90).length;
        const averageProgress = Math.round(
            updatedProgress.reduce((acc, curr) => acc + curr.progress, 0) / totalFeatures
        );

        setImplementationProgress(updatedProgress);
        setSummary({ totalFeatures, completedFeatures, averageProgress });
    }, []);

    return (
        <>
            <Head>
                <title>Development Progress | KAPPY</title>
                <meta name="description" content="Track the development progress of KAPPY's e-commerce platform features and implementations." />
            </Head>

            <Box position="relative" minH="100vh" bg="black" overflow="hidden">
                <AnimatedBackground />
                
                <Box position="relative" zIndex={1}>
                    <Navbar />

                    <Container maxW="container.xl" py={12}>
                        <VStack spacing={12} align="stretch">
                            {/* Header */}
                            <MotionBox
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                textAlign="center"
                            >
                                <Heading 
                                    as="h1" 
                                    size="2xl" 
                                    mb={4}
                                    bgGradient="linear(to-r, white, whiteAlpha.800)"
                                    bgClip="text"
                                >
                                    Development Progress
                                </Heading>
                                <Text 
                                    fontSize="xl" 
                                    color="whiteAlpha.900" 
                                    maxW="800px" 
                                    mx="auto"
                                    mb={8}
                                    textShadow="0 2px 4px rgba(0,0,0,0.4)"
                                >
                                    Track the development status of our e-commerce platform features
                                </Text>

                                {/* Summary Statistics */}
                                <Grid 
                                    templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }}
                                    gap={8}
                                    mb={12}
                                >
                                    <Stat
                                        bg="rgba(0, 0, 0, 0.6)"
                                        backdropFilter="blur(10px)"
                                        borderRadius="lg"
                                            p={6}
                                            borderWidth="1px"
                                            borderColor="whiteAlpha.200"
                                    >
                                        <HStack spacing={3} mb={2}>
                                            <Icon as={FaCheckCircle} color="green.400" w={6} h={6} />
                                            <StatLabel color="whiteAlpha.900">Completed Features</StatLabel>
                                        </HStack>
                                        <StatNumber color="white" fontSize="3xl">
                                            {summary.completedFeatures}/{summary.totalFeatures}
                                        </StatNumber>
                                        <StatHelpText color="whiteAlpha.800">
                                            Features near completion
                                        </StatHelpText>
                                    </Stat>

                                    <Stat
                                            bg="rgba(0, 0, 0, 0.6)"
                                            backdropFilter="blur(10px)"
                                        borderRadius="lg"
                                            p={6}
                                            borderWidth="1px"
                                            borderColor="whiteAlpha.200"
                                    >
                                        <HStack spacing={3} mb={2}>
                                            <Icon as={FaTools} color="yellow.400" w={6} h={6} />
                                            <StatLabel color="whiteAlpha.900">Average Progress</StatLabel>
                                        </HStack>
                                        <StatNumber color="white" fontSize="3xl">
                                            {summary.averageProgress}%
                                        </StatNumber>
                                        <StatHelpText color="whiteAlpha.800">
                                            Overall completion rate
                                        </StatHelpText>
                                    </Stat>

                                    <Stat
                                            bg="rgba(0, 0, 0, 0.6)"
                                            backdropFilter="blur(10px)"
                                        borderRadius="lg"
                                        p={6}
                                        borderWidth="1px"
                                        borderColor="whiteAlpha.200"
                                    >
                                        <HStack spacing={3} mb={2}>
                                            <Icon as={FaClock} color="blue.400" w={6} h={6} />
                                            <StatLabel color="whiteAlpha.900">Time Estimate</StatLabel>
                                        </HStack>
                                        <StatNumber color="white" fontSize="3xl">
                                            {Math.ceil((100 - summary.averageProgress) / 20)} weeks
                                                </StatNumber>
                                        <StatHelpText color="whiteAlpha.800">
                                            Until completion
                                                </StatHelpText>
                                            </Stat>
                                </Grid>

                                <Divider borderColor="whiteAlpha.200" mb={12} />
                                        </MotionBox>

                            {/* Progress Grid */}
                            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                                {implementationProgress.map((item, index) => (
                                        <MotionBox
                                            key={index}
                                        p={8}
                                            borderWidth="1px"
                                            borderColor="whiteAlpha.200"
                                            borderRadius="lg"
                                            bg="rgba(0, 0, 0, 0.6)"
                                            backdropFilter="blur(10px)"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            whileHover={{ 
                                                y: -5, 
                                                boxShadow: "0 20px 30px -10px rgba(0,0,0,0.4)",
                                            borderColor: "rgba(255, 255, 255, 0.4)"
                                        }}
                                    >
                                        <VStack align="stretch" spacing={6}>
                                            <HStack justify="space-between" align="center">
                                                <Heading size="md" color="white">
                                                    {item.feature}
                                                </Heading>
                                                <Badge
                                                    colorScheme={
                                                        item.progress >= 90 ? "green" :
                                                        item.progress >= 70 ? "yellow" :
                                                        item.progress >= 40 ? "orange" : "red"
                                                    }
                                                    px={3}
                                                    py={1}
                                                    borderRadius="full"
                                                >
                                                    {item.status}
                                                </Badge>
                                            </HStack>
                                            
                                            <Text color="whiteAlpha.800" fontSize="md">
                                                {item.description}
                                                </Text>

                                            <Box>
                                                <Tooltip 
                                                    label={`${item.progress}% complete`}
                                                    hasArrow
                                                    placement="top"
                                                >
                                                    <ChakraProgress 
                                                        value={item.progress} 
                                                        colorScheme={
                                                            item.progress >= 90 ? "green" :
                                                            item.progress >= 70 ? "yellow" :
                                                            item.progress >= 40 ? "orange" : "red"
                                                        }
                                                        borderRadius="full"
                                                        bg="whiteAlpha.200"
                                                        height="8px"
                                                    />
                                                </Tooltip>
                                            </Box>

                                            <VStack align="stretch" spacing={2}>
                                                {item.details.map((detail, idx) => (
                                                    <HStack 
                                                        key={idx} 
                                                        spacing={3}
                                                        bg={detail.includes('✓') ? "whiteAlpha.100" : "transparent"}
                                                        p={2}
                                                        borderRadius="md"
                                                    >
                                                        <Icon 
                                                            as={detail.includes('✓') ? FaCheckCircle : FaClock}
                                                            color={detail.includes('✓') ? "green.400" : "yellow.400"}
                                                            w={4}
                                                            h={4}
                                                        />
                                                        <Text 
                                                            color="whiteAlpha.900"
                                                            fontSize="sm"
                                                        >
                                                            {detail.replace('✓', '').replace('Pending: ', '')}
                                                    </Text>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        </VStack>
                                        </MotionBox>
                                    ))}
                                </SimpleGrid>
                        </VStack>
                    </Container>
                </Box>
            </Box>
        </>
    );
} 