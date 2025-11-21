import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useToast } from '@chakra-ui/react';

export default function AnimatedAuthForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const toast = useToast();

    // Check if we should start in signup mode
    useEffect(() => {
        if (router.query.mode === 'signup') {
            const toggle = document.getElementById('register_toggle');
            if (toggle) {
                toggle.checked = true;
            }
        }
    }, [router.query.mode]);

    // Clear form when switching modes
    const handleToggleChange = () => {
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSignupForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            console.log('Attempting to sign in with:', formData.email);
            const result = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
                callbackUrl: router.query.returnUrl || '/'
            });

            console.log('Sign in result:', result);

            if (result?.error) {
                // Handle specific error messages
                let errorMessage = 'Authentication failed';
                if (result.error === 'CredentialsSignin') {
                    errorMessage = 'Invalid email or password';
                } else if (result.error === 'CallbackRouteError') {
                    errorMessage = 'Authentication service error';
                }
                throw new Error(errorMessage);
            }

            if (result.ok) {
                const returnUrl = router.query.returnUrl || '/';
                console.log('Login successful, redirecting to:', returnUrl);
                
                // Show success message
                toast({
                    title: 'Welcome back!',
                    description: 'You have successfully signed in.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                
                // Small delay to show success message before redirect
                setTimeout(() => {
                    router.push(returnUrl);
                }, 1000);
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            toast({
                title: 'Login Failed',
                description: error.message || 'Authentication failed. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!validateSignupForm()) return;

        setIsLoading(true);

        try {
            // Handle signup
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle specific signup errors
                let errorMessage = data.message || 'Something went wrong';
                if (res.status === 409) {
                    errorMessage = 'An account with this email already exists';
                } else if (res.status === 400) {
                    errorMessage = 'Please check your input and try again';
                }
                throw new Error(errorMessage);
            }

            // Show success message for account creation
            toast({
                title: 'Account Created!',
                description: 'Your account has been created successfully.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            // Auto login after successful signup
            const signInResult = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
                callbackUrl: '/'
            });

            console.log('Sign in result:', signInResult);

            if (signInResult?.error) {
                // If auto-login fails, still redirect to home with success message
                console.warn('Auto-login failed after signup:', signInResult.error);
                toast({
                    title: 'Account Created!',
                    description: 'Please sign in with your new credentials.',
                    status: 'info',
                    duration: 5000,
                    isClosable: true,
                });
                // Reset form to login mode
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                document.getElementById('register_toggle').checked = false;
                return;
            }

            // Show welcome message and redirect
            toast({
                title: 'Welcome to KAPPY!',
                description: 'You have been automatically signed in.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error) {
            console.error('Signup error:', error);
            toast({
                title: 'Signup Failed',
                description: error.message || 'Failed to create account. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <>
            <style jsx>{`
                .container {
                    width: 400px;
                    max-width: 90vw;
                    position: relative;
                    border-radius: 10px;
                    overflow: hidden;
                    color: white;
                    box-shadow: 1.5px 1.5px 3px #0e0e0e, -1.5px -1.5px 3px rgb(95 94 94 / 25%), inset 0px 0px 0px #0e0e0e, inset 0px -0px 0px #5f5e5e;
                }

                .container .slider {
                    width: 200%;
                    position: relative;
                    transition: transform ease-out 0.3s;
                    display: flex;
                }

                #register_toggle {
                    display: none;
                }

                .container #register_toggle:checked + .slider {
                    transform: translateX(-50%);
                }

                .form {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    gap: 25px;
                    padding: 2em 2.5em;
                    width: 50%;
                    min-height: 400px;
                }

                .title {
                    text-align: center;
                    font-weight: 700;
                    font-size: 2.2em;
                    margin-bottom: 10px;
                }

                form .form_control {
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                }

                form .form_control .label {
                    position: absolute;
                    top: 50%;
                    left: 10px;
                    transition: transform ease 0.2s;
                    transform: translate(0%, -50%);
                    font-size: 0.75em;
                    user-select: none;
                    pointer-events: none;
                    color: #b0b0b0;
                }

                form .form_control .input {
                    width: 100%;
                    background-color: transparent;
                    border: none;
                    outline: none;
                    color: #fff;
                    padding: 0.75rem;
                    font-size: 0.9rem;
                    border-radius: 8px;
                    transition: box-shadow ease 0.2s;
                    box-shadow: 0px 0px 0px #0e0e0e, 0px 0px 0px rgb(95 94 94 / 25%), inset 1.5px 1.5px 3px #0e0e0e, inset -1.5px -1.5px 3px #5f5e5e;
                }

                form .form_control .input:focus,
                form .form_control .input:valid {
                    box-shadow: 0px 0px 0px #0e0e0e, 0px 0px 0px rgb(95 94 94 / 25%), inset 3px 3px 4px #0e0e0e, inset -3px -3px 4px #5f5e5e;
                }

                form .form_control .input:focus + .label,
                form .form_control .input:valid + .label {
                    transform: translate(-150%, -50%);
                }

                form button {
                    width: 100%;
                    background-color: transparent;
                    border: none;
                    outline: none;
                    color: #fff;
                    padding: 0.75rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border-radius: 8px;
                    transition: box-shadow ease 0.1s;
                    box-shadow: 1.5px 1.5px 3px #0e0e0e, -1.5px -1.5px 3px rgb(95 94 94 / 25%), inset 0px 0px 0px #0e0e0e, inset 0px -0px 0px #5f5e5e;
                    cursor: pointer;
                    margin-top: 10px;
                }

                form button:active {
                    box-shadow: 0px 0px 0px #0e0e0e, 0px 0px 0px rgb(95 94 94 / 25%), inset 3px 3px 4px #0e0e0e, inset -3px -3px 4px #5f5e5e;
                }

                form button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .bottom_text {
                    font-size: 0.65em;
                }

                .bottom_text .swtich {
                    font-weight: 700;
                    cursor: pointer;
                }

                .error-message {
                    color: #ff6b6b;
                    font-size: 0.6em;
                    margin-top: 5px;
                    text-align: left;
                    width: 100%;
                }

                @media (max-width: 480px) {
                    .container {
                        width: 320px;
                    }
                    
                    .form {
                        padding: 1.5em 2em;
                        gap: 20px;
                        min-height: 350px;
                    }
                    
                    .title {
                        font-size: 1.8em;
                    }
                }
            `}</style>

            <div className="container">
                <input type="checkbox" id="register_toggle" />
                <div className="slider">
                    <form className="form" onSubmit={handleLogin}>
                        <span className="title">Login</span>
                        <div className="form_control">
                            <input 
                                type="email" 
                                className="input" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required 
                            />
                            <label className="label">Email</label>
                            {errors.email && <div className="error-message">{errors.email}</div>}
                        </div>
                        <div className="form_control">
                            <input 
                                type="password" 
                                className="input" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required 
                            />
                            <label className="label">Password</label>
                            {errors.password && <div className="error-message">{errors.password}</div>}
                        </div>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>

                        <span className="bottom_text">
                            Don&apos;t have an account? 
                            <label htmlFor="register_toggle" className="swtich" onClick={handleToggleChange}>Sign Up</label>
                        </span>
                    </form>
                    
                    <form className="form" onSubmit={handleSignup}>
                        <span className="title">Sign Up</span>
                        <div className="form_control">
                            <input 
                                type="text" 
                                className="input" 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required 
                            />
                            <label className="label">Username</label>
                            {errors.name && <div className="error-message">{errors.name}</div>}
                        </div>
                        <div className="form_control">
                            <input 
                                type="email" 
                                className="input" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required 
                            />
                            <label className="label">Email</label>
                            {errors.email && <div className="error-message">{errors.email}</div>}
                        </div>
                        <div className="form_control">
                            <input 
                                type="password" 
                                className="input" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required 
                            />
                            <label className="label">Password</label>
                            {errors.password && <div className="error-message">{errors.password}</div>}
                        </div>
                        <div className="form_control">
                            <input 
                                type="password" 
                                className="input" 
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required 
                            />
                            <label className="label">Confirm Password</label>
                            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                        </div>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>

                        <span className="bottom_text">
                            Already have an account? 
                            <label htmlFor="register_toggle" className="swtich" onClick={handleToggleChange}>Sign In</label>
                        </span>
                    </form>
                </div>
            </div>
        </>
    );
}
