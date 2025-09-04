import { useEffect, useState } from "react";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import parse from "html-react-parser";
// import draftToHtml from "draftjs-to-html";

import "./App.css";

const kataToHira = (str) =>
	str.replace(/[\u30a1-\u30f6]/g, (ch) =>
		String.fromCharCode(ch.charCodeAt(0) - 0x60)
	);

function App() {
	const [text, setText] = useState("");
	// const [savedTokens, setSavedTokens] = useState(null);
	const [previewState, setPreviewState] = useState(null);
	const [tokens, setTokens] = useState([]);
	const [tokenizer, setTokenizer] = useState(null);
	const [editorState, setEditorState] = useState(EditorState.createEmpty());
	// const [hovered, setHovered] = useState({});
	const [loading, setLoading] = useState(false);

	const renderTokens = (tokens, type) =>
		tokens.map((t, i) => {
			return t.reading && kataToHira(t.reading) !== t.surface_form ? (
				<ruby key={`${i}-${type}`} style={{ marginRight: 4, cursor: "pointer" }}>
					{t.surface_form}
					<rt style={{ fontSize: "0.6em" }}>{kataToHira(t.reading)}</rt>
				</ruby>
			) : (
				<ruby key={`${i}-${type}`}>{t.surface_form}</ruby>
			);
		});

	useEffect(() => {
		setLoading(true);
		window.kuromoji.builder({ dicPath: "/dict/" }).build((err, tokenizer) => {
			if (err) {
				console.error(err);
			} else {
				setTokenizer(tokenizer);
				setLoading(false);
			}
		});
	}, []);

	const handleTextChange = (e) => {
		let value = e.target.value;

		setText(value);

		if (tokenizer && value) {
			const result = tokenizer.tokenize(value);
			setTokens(result);
		}
	};

	const onEditorStateChange = async (state) => {
		// setSavedTokens(null);
		setEditorState(state);

		if (tokenizer) {
			const rawContent = convertToRaw(state.getCurrentContent());
			const baseHtml = draftToHtml(rawContent);

			// ✅ preserve RTE styling and insert furigana only in text nodes
			const parsed = parse(baseHtml, {
				replace: (domNode) => {
					if (domNode.type === "text" && domNode.data.trim() !== "") {
						const tokens = tokenizer.tokenize(domNode.data);
						return <>{renderTokens(tokens, "rte")}</>;
					}
				},
			});

			setPreviewState(parsed);
		}
	};

	return (
		<div
			style={{
				maxWidth: 600,
				fontFamily: "sans-serif",
				margin: "auto",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				overflowY: "auto",
				padding: "0 200px",
			}}
		>
			<h2>Kanji To Furigana</h2>

			<input
				value={text}
				onChange={handleTextChange}
				placeholder="example: 日本語を勉強します"
				style={{ padding: 8, fontSize: 16 }}
				disabled={loading}
			/>

			<div style={{ marginTop: 20, fontSize: "1.5rem", lineHeight: 1.8 }}>
				<span>Result: </span>
				<div>{text && renderTokens(tokens, "input")}</div>
			</div>

			<div style={{ marginTop: 80 }}>
				<Editor
					editorState={editorState}
					onEditorStateChange={onEditorStateChange}
					editorStyle={{
						minHeight: 120,
						border: "1px solid #ddd",
						padding: "8px",
						overflow: "auto",
					}}
					toolbar={{
						options: ["inline", "list", "history", "textAlign"],
						inline: {
							inDropdown: false,
							options: ["bold", "italic", "underline"],
						},
						list: {
							inDropdown: false,
							options: ["unordered", "ordered"],
						},
						history: {
							inDropdown: false,
							options: ["undo", "redo"],
						},
						textAlign: {
							inDropdown: false,
							options: ["left", "center", "right"],
						},
					}}
				/>
			</div>

			<div style={{ marginTop: 20, fontSize: "1.5rem" }}>
				<span>Result: </span>
				<div>{previewState}</div>
			</div>

			{loading && (
				<div class="spinner-container">
					<div class="spinner" />
				</div>
			)}
		</div>
	);
}

export default App;
