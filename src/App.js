import { useEffect, useState } from "react";
import { Editor } from "react-draft-wysiwyg";
import { EditorState } from "draft-js";
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
	const [hovered, setHovered] = useState({});

	const renderTokens = (tokens, type) =>
		tokens.map((t, i) => {
			// console.log("chunk kata", t);
			return t.reading && kataToHira(t.reading) !== t.surface_form ? (
				<ruby
					key={i}
					style={{ marginRight: 4, cursor: "pointer" }}
					onMouseEnter={() => setHovered({ ...hovered, [`${i}-${type}`]: true })}
					onMouseLeave={() => setHovered({ ...hovered, [`${i}-${type}`]: false })}
				>
					{t.surface_form}
					<rt
						style={{
							fontSize: "0.6em",
							visibility: hovered[`${i}-${type}`] ? "visible" : "hidden",
						}}
					>
						{kataToHira(t.reading)}
					</rt>
				</ruby>
			) : (
				<ruby key={i}>{t.surface_form}</ruby>
			);
		});

	useEffect(() => {
		const loadKuromoji = async () => {
			if (!window.kuromoji) {
				await new Promise((resolve, reject) => {
					const script = document.createElement("script");
					script.src = "https://unpkg.com/kuromoji@0.1.2/build/kuromoji.js";
					script.onload = resolve;
					script.onerror = reject;
					document.body.appendChild(script);
				});
			}

			window.kuromoji
				.builder({
					dicPath: "https://unpkg.com/kuromoji@0.1.2/dict/",
				})
				.build((err, tokenizer) => {
					if (err) console.error(err);
					else setTokenizer(tokenizer);
				});
		};

		loadKuromoji();
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
			const plainText = state.getCurrentContent().getPlainText(); // fixed: use `state`, not `editorState`
			const tokens = tokenizer.tokenize(plainText);

			// Instead of string HTML, directly render tokens into JSX
			setPreviewState(tokens);
		}
	};

	// const handleSave = () => {
	// 	const rawContent = convertToRaw(editorState.getCurrentContent());
	// 	const baseHtml = draftToHtml(rawContent);

	// 	if (tokenizer) {
	// 		const plainText = editorState.getCurrentContent().getPlainText();
	// 		const tokens = tokenizer.tokenize(plainText);

	// 		let htmlWithRuby = baseHtml;

	// 		tokens.forEach((t) => {
	// 			if (t.reading && kataToHira(t.reading) !== t.surface_form) {
	// 				const ruby = `<ruby>${t.surface_form}<rt>${kataToHira(
	// 					t.reading
	// 				)}</rt></ruby>`;
	// 				htmlWithRuby = htmlWithRuby.replace(t.surface_form, ruby);
	// 			} else {
	// 				const ruby = `<ruby>${t.surface_form}</ruby>`;
	// 				htmlWithRuby = htmlWithRuby.replace(t.surface_form, ruby);
	// 			}
	// 		});

	// 		console.log("Saved HTML:", htmlWithRuby);

	// 		// ⬅️ save as string
	// 		setSavedTokens(htmlWithRuby);
	// 	}
	// };

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
				placeholder="contoh: 日本語を勉強します"
				style={{ padding: 8, fontSize: 16 }}
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
				{/* <button onClick={handleSave} style={{ marginTop: 10 }}>
					Save
				</button> */}
			</div>

			<div style={{ marginTop: 20, fontSize: "1.5rem" }}>
				<span>Result: </span>
				<div>{previewState && renderTokens(previewState, "rte")}</div>
			</div>

			{/* {savedTokens && (
				<div style={{ marginTop: 5 }}>
					<h3>Saved HTML:</h3>
					{savedTokens}
				</div>
			)} */}
		</div>
	);
}

export default App;
