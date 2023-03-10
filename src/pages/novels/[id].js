import supabase from "@/utils/supabase";
import Head from "next/head";
import Banner from "@/components/Banner";
import {
	Button,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	FormControl,
	Input,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	Select,
	Textarea,
	useToast,
	HStack,
	Grid,
	GridItem,
	Text,
	VStack,
	Center,
	TableContainer,
	Table,
	Thead,
	Tr,
	Th,
	Tbody,
	Td,
} from "@chakra-ui/react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState, useEffect } from "react";
import { useDisclosure } from "@chakra-ui/react";
import Link from "next/link";
import Image from "next/image";

export async function getServerSideProps(context) {
	const { id } = context.query;

	const { data: novel, error: novelError } = await supabase
		.from("Novels")
		.select("*")
		.eq("id", id)
		.single();

	return {
		props: {
			novel,
		},
	};
}

export default function Novel({ novel }) {
	const session = useSession();
	const [isInLibrary, setIsInLibrary] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [books, setBooks] = useState([]);

	const checkAdmin = async () => {
		if (!session?.user) return;

		const { data, error } = await supabase
			.from("Users")
			.select("admin")
			.eq("id", session.user.id)
			.single();

		if (data.admin) {
			setIsAdmin(true);
		}
	};

	useEffect(() => {
		checkAdmin();
	}, [session]);

	const getBooks = async ({ novel }) => {
		const { data, error } = await supabase
			.from("Books")
			.select("*")
			.eq("novel_id", novel.id);

		if (data) setBooks(data);
	};

	useEffect(() => {
		getBooks({ novel });
	}, [novel]);

	return (
		<>
			<Head>
				<title>{novel.title}</title>
				<meta name="description" content="Generated by create next app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<Banner title={""} src={novel.cover} />

			<div className="min-w-screen min-h-screen">
				<Grid templateColumns="repeat(3, 1fr)">
					<GridItem colSpan={1}>
						<VStack>
							<Image
								src={novel.cover}
								alt={novel.title}
								width={286}
								height={400}
							/>
							<HStack>
								{session && !isInLibrary && <AddToLibrary novel={novel} />}
								{session && isInLibrary && <AddToLibrary novel={novel} />}
								{session && isAdmin && <EditNovel novel={novel} />}
							</HStack>
						</VStack>
					</GridItem>

					<GridItem colSpan={2}>
						<Text className="mb-4 text-2xl font-bold">{novel.title}</Text>
						<Text className="mb-4 text-xl font-semibold">{novel.author}</Text>
						<Text
							className="mb-4 w-2/3 text-lg"
							dangerouslySetInnerHTML={{ __html: novel.description }}
						/>
					</GridItem>
				</Grid>
				{books.length > 0 && (
					<Center className="mt-16">
						<TableContainer className="w-2/3 rounded-lg border border-gray-400">
							<Table>
								<Thead>
									<Tr>
										<Th>Cover</Th>
										<Th>Title</Th>
										<Th isNumeric>Volume</Th>
									</Tr>
								</Thead>
								<Tbody>
									{books.map((book) => (
										<Tr key={book.id}>
											<Td>
												<Image
													src={book.cover}
													alt={book.title}
													width={100}
													height={150}
												/>
											</Td>
											<Td>
												<Link href={`/books/${book.id}`}>{book.title}</Link>
											</Td>
											<Td isNumeric>{book.volume}</Td>
										</Tr>
									))}
								</Tbody>
							</Table>
						</TableContainer>
					</Center>
				)}
			</div>
		</>
	);
}

function AddToLibrary({ novel }) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [status, setStatus] = useState("Reading");
	const [score, setScore] = useState();
	const [progress, setProgress] = useState();
	const [dateStarted, setDateStarted] = useState();
	const [dateFinished, setDateFinished] = useState();
	const [isInLibrary, setIsInLibrary] = useState(false);
	const toast = useToast();

	const session = useSession();

	const addToLibrary = async () => {
		const { data, error } = await supabase
			.from("Library")
			.select("*")
			.eq("user_id", session.user.id)
			.eq("novel_id", novel.id);

		if (data?.length === 0 || data === null) {
			const { data, error } = await supabase.from("Library").insert([
				{
					user_id: session.user.id,
					novel_id: novel.id,
					status: status,
					score: score,
					progress: progress,
					date_started: dateStarted,
					date_finished: dateFinished,
				},
			]);
		} else {
			const { data, error } = await supabase
				.from("Library")
				.update({
					status: status,
					score: score,
					progress: progress,
					date_started: dateStarted,
					date_finished: dateFinished,
				})
				.eq("user_id", session.user.id)
				.eq("novel_id", novel.id);
		}

		if (!error) {
			setIsInLibrary(true);
			setStatus(status);
		} else {
			console.log(error);
		}
	};

	const checkIfInLibrary = async () => {
		if (session) {
			const { data, error } = await supabase
				.from("Library")
				.select("*")
				.eq("user_id", session.user.id)
				.eq("novel_id", novel.id);

			if (data?.length === 0 || data === null) {
				setIsInLibrary(false);
			} else {
				setIsInLibrary(true);
				setStatus(data[0].status);
				setScore(data[0].score);
				setProgress(data[0].progress);
				setDateStarted(data[0].date_started);
				setDateFinished(data[0].date_finished);
			}
		}
	};

	useEffect(() => {
		checkIfInLibrary();
	}, [session]);

	const deleteFromLibrary = async () => {
		if (session && isInLibrary) {
			const { data, error } = await supabase
				.from("Library")
				.delete()
				.eq("user_id", session.user.id)
				.eq("novel_id", novel.id);

			if (!error) {
				setIsInLibrary(false);
			} else {
				console.log(error);
			}
		}
	};

	return (
		<>
			{session && !isInLibrary && (
				<Button onClick={onOpen}>Add To Library</Button>
			)}
			{session && isInLibrary && <Button onClick={onOpen}>{status}</Button>}
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>{novel.title}</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<FormControl
							id="status"
							isRequired
							display="flex"
							flexDirection="column"
						>
							<label>Status</label>
							<Select
								value={status}
								onChange={(e) => setStatus(e.target.value)}
								variant={"filled"}
							>
								<option value="Reading">Reading</option>
								<option value="Plan to Read">Plan to Read</option>
								<option value="Completed">Completed</option>
								<option value="On Hold">On Hold</option>
								<option value="Dropped">Dropped</option>
							</Select>

							<label>Score</label>
							<NumberInput
								max={10}
								min={0}
								value={score || 0}
								onChange={(value) => setScore(value)}
							>
								<NumberInputField />
								<NumberInputStepper>
									<NumberIncrementStepper />
									<NumberDecrementStepper />
								</NumberInputStepper>
							</NumberInput>

							<label>Progress</label>
							<NumberInput
								max={novel.chapters}
								min={0}
								value={progress || 0}
								onChange={(value) => setProgress(value)}
							>
								<NumberInputField />
								<NumberInputStepper>
									<NumberIncrementStepper />
									<NumberDecrementStepper />
								</NumberInputStepper>
							</NumberInput>

							<label>Date Started</label>
							<Input
								placeholder="Select Date"
								size="md"
								type="date"
								value={dateStarted || ""}
								onChange={(e) => setDateStarted(e.target.value)}
							/>

							<label>Date Finished</label>
							<Input
								placeholder="Select Date"
								size="md"
								type="date"
								value={dateFinished || ""}
								onChange={(e) => setDateFinished(e.target.value)}
							/>
						</FormControl>
					</ModalBody>
					<ModalFooter>
						<Button
							variant={"ghost"}
							colorScheme="red"
							onClick={async () => {
								await deleteFromLibrary();
								toast({
									title: "Novel removed from library",
									description: "Novel removed from library",
									status: "error",
									duration: 9000,
									isClosable: true,
								});
								onClose();
							}}
							size="sm"
						>
							Delete
						</Button>
						<Button
							variant="ghost"
							onClick={async () => {
								await addToLibrary();
								if (isInLibrary) {
									toast({
										title: "Novel added to library",
										description: "Novel added to library",
										status: "success",
										duration: 5000,
										isClosable: true,
									});
								} else {
									toast({
										title: "Novel updated in library",
										description: "Novel updated in library",
										status: "success",
										duration: 5000,
										isClosable: true,
									});
								}
								onClose();
							}}
							size="sm"
							mr={3}
						>
							Save
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}

function EditNovel({ novel }) {
	const {
		isOpen: isEditOpen,
		onOpen: onEditOpen,
		onClose: onEditClose,
	} = useDisclosure();

	const [title, setTitle] = useState(novel.title);
	const [author, setAuthor] = useState(novel.author);
	const [cover, setCover] = useState(novel.cover);
	const [description, setDescription] = useState(novel.description);
	const [id, setId] = useState(novel.id);

	const updateNovel = async () => {
		const { data, error } = await supabase
			.from("Novels")
			.update({
				title: title,
				author: author,
				cover: cover,
				description: description,
			})
			.eq("id", id);
	};

	return (
		<>
			<Button onClick={onEditOpen}>Edit Novel</Button>

			<Modal isOpen={isEditOpen} onClose={onEditClose}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Edit Novel</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<FormControl id="title" isRequired>
							<label>Title</label>
							<Input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</FormControl>
						<FormControl id="author" isRequired>
							<label>Author</label>
							<Input
								type="text"
								value={author}
								onChange={(e) => setAuthor(e.target.value)}
							/>
						</FormControl>
						<FormControl id="cover" isRequired>
							<label>Cover</label>
							<Input
								type="text"
								value={cover}
								onChange={(e) => setCover(e.target.value)}
							/>
						</FormControl>
						<FormControl id="description" isRequired>
							<label>Description</label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</FormControl>
					</ModalBody>
					<ModalFooter>
						<Button
							variant={"ghost"}
							colorScheme="red"
							onClick={async () => {
								await updateNovel();
								window.location.reload();
								onEditClose();
							}}
							size="sm"
						>
							Update
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
