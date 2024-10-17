import { ReactNode } from 'react';
import { StaticImage } from 'gatsby-plugin-image';
import { Box, Center } from '@chakra-ui/react';

type TitleProps = {
  children: ReactNode;
};

export default function Title({ children }: TitleProps) {
  return (
    <Box>
      <Center>
        <StaticImage
          src="../images/logo.svg"
          alt="Alles Standard"
          width={520}
          placeholder="blurred"
          style={{ marginRight: '8px' }}
        />
      </Center>
    </Box>
  );
}
