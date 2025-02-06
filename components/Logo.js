import { Image } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionImage = motion(Image);

export default function Logo({ size = '40px', isAnimated = false }) {
    if (!isAnimated) {
        return (
            <Image
                src="/images/logo3.jpg"
                alt="KAPPY Logo"
                width={size}
                height={size}
                objectFit="contain"
            />
        );
    }

    return (
        <MotionImage
            src="/images/logo3.jpg"
            alt="KAPPY Logo"
            width={size}
            height={size}
            objectFit="contain"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
        />
    );
} 