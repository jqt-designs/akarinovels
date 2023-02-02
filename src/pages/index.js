import Head from "next/head";
import Image from "next/image";
import { useColorMode, Button } from "@chakra-ui/react";
import { useSession } from "@supabase/auth-helpers-react";

export default function Home() {
	const { colorMode, toggleColorMode } = useColorMode();
	const session = useSession();

	return (
		<>
			<Head>
				<title>Create Next App</title>
				<meta name="description" content="Generated by create next app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className="">
				Hello World
				<Button colorScheme="teal" onClick={toggleColorMode}>
					Button
				</Button>
			</div>
		</>
	);
}
