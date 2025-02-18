import {
    Box,
    Container,
    Heading,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Button,
    useToast,
    Code,
    Flex,
    Spacer,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Input,
    FormControl,
    FormLabel,
    VStack,
    HStack,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { getSession, signIn } from 'next-auth/react';
import Head from 'next/head';
import Navbar from '../../components/Navbar';

// Add new component for script execution
const ScriptRunner = () => {
    const [scriptStatus, setScriptStatus] = useState({});
    const [isRunning, setIsRunning] = useState(false);

    const scripts = [
        {
            name: 'Migrate Database',
            id: 'migrate-db',
            description: 'Initialize or update database schema',
            script: 'migrate-db.js'
        },
        {
            name: 'Migrate Orders',
            id: 'migrate-orders',
            description: 'Update orders table structure',
            script: 'migrate-orders.js'
        },
        {
            name: 'Sync Data',
            id: 'sync-data',
            description: 'Synchronize data between JSON and MySQL',
            script: 'sync-data.js'
        },
        {
            name: 'Hash Passwords',
            id: 'hash-passwords',
            description: 'Update password hashes in the database',
            script: 'hash-passwords.js'
        }
    ];

    const runScript = async (scriptName) => {
        setIsRunning(true);
        setScriptStatus(prev => ({ ...prev, [scriptName]: 'running' }));
        
        try {
            const response = await fetch('/api/dev/run-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ script: scriptName }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setScriptStatus(prev => ({ ...prev, [scriptName]: 'success' }));
            } else {
                setScriptStatus(prev => ({ ...prev, [scriptName]: 'error' }));
                console.error('Script error:', data.error);
            }
        } catch (error) {
            console.error('Error running script:', error);
            setScriptStatus(prev => ({ ...prev, [scriptName]: 'error' }));
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="bold" mb={4}>
                Database Management Scripts
            </Text>
            {scripts.map((script) => (
                <Box
                    key={script.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    bg="gray.700"
                >
                    <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{script.name}</Text>
                            <Text fontSize="sm" color="gray.400">
                                {script.description}
                            </Text>
                        </VStack>
                        <HStack>
                            {scriptStatus[script.script] && (
                                <Badge
                                    colorScheme={
                                        scriptStatus[script.script] === 'success'
                                            ? 'green'
                                            : scriptStatus[script.script] === 'error'
                                            ? 'red'
                                            : 'yellow'
                                    }
                                >
                                    {scriptStatus[script.script]}
                                </Badge>
                            )}
                            <Button
                                colorScheme="blue"
                                size="sm"
                                isLoading={isRunning && scriptStatus[script.script] === 'running'}
                                onClick={() => runScript(script.script)}
                            >
                                Run Script
                            </Button>
                        </HStack>
                    </HStack>
                </Box>
            ))}
        </VStack>
    );
};

export default function DevDashboard() {
    const [jsonData, setJsonData] = useState({
        users: null,
        products: null,
        orders: null
    });
    const [mysqlData, setMysqlData] = useState({
        users: null,
        products: null,
        orders: null
    });
    const [differences, setDifferences] = useState({
        users: [],
        products: [],
        orders: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();
    const [authTest, setAuthTest] = useState({
        email: '',
        password: '',
        loading: false,
        result: null,
        envConfig: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            
            // Fetch JSON data
            const jsonResponse = await fetch('/api/dev/json-data');
            const jsonResult = await jsonResponse.json();
            setJsonData(jsonResult);

            // Fetch MySQL data
            const mysqlResponse = await fetch('/api/dev/mysql-data');
            const mysqlResult = await mysqlResponse.json();
            setMysqlData(mysqlResult);

            // Compare data
            compareData(jsonResult, mysqlResult);
        } catch (error) {
            toast({
                title: 'Error fetching data',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const compareData = (json, mysql) => {
        const diffs = {
            users: [],
            products: [],
            orders: []
        };

        // Compare users
        if (json.users && mysql.users) {
            json.users.forEach(jsonUser => {
                const mysqlUser = mysql.users.find(u => u.email === jsonUser.email);
                if (!mysqlUser) {
                    diffs.users.push({ type: 'missing_in_mysql', data: jsonUser });
                } else if (JSON.stringify(jsonUser) !== JSON.stringify(mysqlUser)) {
                    diffs.users.push({ 
                        type: 'different', 
                        json: jsonUser, 
                        mysql: mysqlUser 
                    });
                }
            });
        }

        // Compare products
        if (json.products && mysql.products) {
            json.products.forEach(jsonProduct => {
                const mysqlProduct = mysql.products.find(p => p.id === jsonProduct.id);
                if (!mysqlProduct) {
                    diffs.products.push({ type: 'missing_in_mysql', data: jsonProduct });
                } else if (JSON.stringify(jsonProduct) !== JSON.stringify(mysqlProduct)) {
                    diffs.products.push({ 
                        type: 'different', 
                        json: jsonProduct, 
                        mysql: mysqlProduct 
                    });
                }
            });
        }

        setDifferences(diffs);
    };

    const renderDataTable = (data, type) => {
        if (!data || data.length === 0) return <Text>No data available</Text>;

        const columns = Object.keys(data[0]);
        
        return (
            <Box overflowX="auto">
                <Table variant="simple" size="sm">
                    <Thead>
                        <Tr>
                            {columns.map(column => (
                                <Th key={column}>{column}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data.map((item, index) => (
                            <Tr key={index}>
                                {columns.map(column => (
                                    <Td key={column}>
                                        {typeof item[column] === 'object' 
                                            ? <Code>{JSON.stringify(item[column])}</Code>
                                            : String(item[column])
                                        }
                                    </Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    };

    const renderDifferences = (diffs, type) => {
        if (!diffs || diffs.length === 0) return (
            <Alert status="success">
                <AlertIcon />
                <AlertTitle>No differences found!</AlertTitle>
                <AlertDescription>The {type} data is synchronized between JSON and MySQL.</AlertDescription>
            </Alert>
        );

        return diffs.map((diff, index) => (
            <Alert key={index} status="warning" mb={4}>
                <Box>
                    <AlertTitle>Difference found in {type}</AlertTitle>
                    <AlertDescription>
                        <Text>Type: {diff.type}</Text>
                        {diff.type === 'missing_in_mysql' ? (
                            <Code display="block" whiteSpace="pre" mt={2}>
                                {JSON.stringify(diff.data, null, 2)}
                            </Code>
                        ) : (
                            <>
                                <Text fontWeight="bold" mt={2}>JSON:</Text>
                                <Code display="block" whiteSpace="pre">
                                    {JSON.stringify(diff.json, null, 2)}
                                </Code>
                                <Text fontWeight="bold" mt={2}>MySQL:</Text>
                                <Code display="block" whiteSpace="pre">
                                    {JSON.stringify(diff.mysql, null, 2)}
                                </Code>
                            </>
                        )}
                    </AlertDescription>
                </Box>
            </Alert>
        ));
    };

    // New function to test authentication
    const testAuth = async () => {
        try {
            setAuthTest(prev => ({ ...prev, loading: true, result: null }));
            
            // First, check environment configuration
            const configResponse = await fetch('/api/dev/auth-config');
            const configResult = await configResponse.json();
            setAuthTest(prev => ({ ...prev, envConfig: configResult }));

            // Test authentication
            const result = await signIn('credentials', {
                redirect: false,
                email: authTest.email,
                password: authTest.password
            });

            setAuthTest(prev => ({
                ...prev,
                result: {
                    success: !result.error,
                    error: result.error,
                    timestamp: new Date().toISOString()
                }
            }));

        } catch (error) {
            setAuthTest(prev => ({
                ...prev,
                result: {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            }));
        } finally {
            setAuthTest(prev => ({ ...prev, loading: false }));
        }
    };

    const renderAuthTestSection = () => (
        <Box>
            <VStack spacing={4} align="stretch">
                <FormControl>
                    <FormLabel>Test Email</FormLabel>
                    <Input 
                        value={authTest.email}
                        onChange={(e) => setAuthTest(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter test email"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Test Password</FormLabel>
                    <Input 
                        type="password"
                        value={authTest.password}
                        onChange={(e) => setAuthTest(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter test password"
                    />
                </FormControl>

                <Button
                    colorScheme="blue"
                    onClick={testAuth}
                    isLoading={authTest.loading}
                >
                    Test Authentication
                </Button>

                {authTest.envConfig && (
                    <Alert status="info" mt={4}>
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Environment Configuration</AlertTitle>
                            <AlertDescription>
                                <Code display="block" whiteSpace="pre" mt={2}>
                                    NEXTAUTH_URL: {authTest.envConfig.NEXTAUTH_URL}
                                    <br />
                                    NEXT_PUBLIC_API_URL: {authTest.envConfig.NEXT_PUBLIC_API_URL}
                                    <br />
                                    Current Instance IP: {authTest.envConfig.instanceIP}
                                </Code>
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}

                {authTest.result && (
                    <Alert 
                        status={authTest.result.success ? "success" : "error"}
                        mt={4}
                    >
                        <AlertIcon />
                        <Box>
                            <AlertTitle>
                                {authTest.result.success ? "Authentication Successful" : "Authentication Failed"}
                            </AlertTitle>
                            <AlertDescription>
                                <Text>Timestamp: {authTest.result.timestamp}</Text>
                                {authTest.result.error && (
                                    <Text color="red.500">Error: {authTest.result.error}</Text>
                                )}
                            </AlertDescription>
                        </Box>
                    </Alert>
                )}
            </VStack>
        </Box>
    );

    return (
        <>
            <Head>
                <title>Developer Dashboard | KAPPY</title>
                <meta name="description" content="Developer dashboard for database inspection" />
            </Head>

            <Box minH="100vh" bg="gray.900">
                <Navbar />
                <Container maxW="container.xl" py={8}>
                    <Flex align="center" mb={8}>
                        <Heading color="white">Developer Dashboard</Heading>
                        <Spacer />
                        <Button
                            colorScheme="blue"
                            onClick={fetchData}
                            isLoading={isLoading}
                        >
                            Refresh Data
                        </Button>
                    </Flex>

                    <Box bg="gray.800" p={6} borderRadius="lg" boxShadow="xl">
                        <Tabs variant="enclosed" colorScheme="blue">
                            <TabList>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Users</Tab>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Products</Tab>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Orders</Tab>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Differences</Tab>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Auth Testing</Tab>
                                <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Scripts</Tab>
                            </TabList>

                            <TabPanels bg="white" borderRadius="lg" mt={4}>
                                <TabPanel>
                                    <Tabs>
                                        <TabList>
                                            <Tab>JSON Data</Tab>
                                            <Tab>MySQL Data</Tab>
                                        </TabList>
                                        <TabPanels>
                                            <TabPanel>
                                                {renderDataTable(jsonData.users, 'users')}
                                            </TabPanel>
                                            <TabPanel>
                                                {renderDataTable(mysqlData.users, 'users')}
                                            </TabPanel>
                                        </TabPanels>
                                    </Tabs>
                                </TabPanel>

                                <TabPanel>
                                    <Tabs>
                                        <TabList>
                                            <Tab>JSON Data</Tab>
                                            <Tab>MySQL Data</Tab>
                                        </TabList>
                                        <TabPanels>
                                            <TabPanel>
                                                {renderDataTable(jsonData.products, 'products')}
                                            </TabPanel>
                                            <TabPanel>
                                                {renderDataTable(mysqlData.products, 'products')}
                                            </TabPanel>
                                        </TabPanels>
                                    </Tabs>
                                </TabPanel>

                                <TabPanel>
                                    <Tabs>
                                        <TabList>
                                            <Tab>JSON Data</Tab>
                                            <Tab>MySQL Data</Tab>
                                        </TabList>
                                        <TabPanels>
                                            <TabPanel>
                                                {renderDataTable(jsonData.orders, 'orders')}
                                            </TabPanel>
                                            <TabPanel>
                                                {renderDataTable(mysqlData.orders, 'orders')}
                                            </TabPanel>
                                        </TabPanels>
                                    </Tabs>
                                </TabPanel>

                                <TabPanel>
                                    <Tabs>
                                        <TabList>
                                            <Tab>Users</Tab>
                                            <Tab>Products</Tab>
                                            <Tab>Orders</Tab>
                                        </TabList>
                                        <TabPanels>
                                            <TabPanel>
                                                {renderDifferences(differences.users, 'users')}
                                            </TabPanel>
                                            <TabPanel>
                                                {renderDifferences(differences.products, 'products')}
                                            </TabPanel>
                                            <TabPanel>
                                                {renderDifferences(differences.orders, 'orders')}
                                            </TabPanel>
                                        </TabPanels>
                                    </Tabs>
                                </TabPanel>

                                <TabPanel>
                                    {renderAuthTestSection()}
                                </TabPanel>

                                <TabPanel>
                                    <ScriptRunner />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </Box>
                </Container>
            </Box>
        </>
    );
}

export async function getServerSideProps(context) {
    const session = await getSession(context);
    
    if (!session || session.user.role !== 'admin') {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        };
    }

    return {
        props: { session }
    };
} 