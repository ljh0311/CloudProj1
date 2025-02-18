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

            <Container maxW="container.xl" py={8}>
                <Flex align="center" mb={8}>
                    <Heading>Developer Dashboard</Heading>
                    <Spacer />
                    <Button
                        colorScheme="blue"
                        onClick={fetchData}
                        isLoading={isLoading}
                    >
                        Refresh Data
                    </Button>
                </Flex>

                <Tabs>
                    <TabList>
                        <Tab>Users</Tab>
                        <Tab>Products</Tab>
                        <Tab>Orders</Tab>
                        <Tab>Differences</Tab>
                        <Tab>Auth Testing</Tab>
                    </TabList>

                    <TabPanels>
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
                    </TabPanels>
                </Tabs>
            </Container>
        </>
    );
}

export async function getServerSideProps(context) {
    // No session check needed - dashboard is public
    return {
        props: {}
    };
} 