import { ReactNode, Fragment } from 'react';
import { StaticImage } from 'gatsby-plugin-image';
import { Box, Center, Heading } from '@chakra-ui/react';

type TitleProps = {
  children: ReactNode;
};

export default function Title({ children }: TitleProps) {
  return (
    <Fragment>
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
      <Box>
        <Center>
          <Heading>{children}</Heading>
        </Center>
      </Box>
    </Fragment>
  );
}
