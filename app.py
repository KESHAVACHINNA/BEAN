import streamlit as st
import openai
import os

# Set OpenAI API key securely from Streamlit secrets or environment variable
if "openai" in st.secrets:
    openai.api_key = st.secrets["openai"]["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"]
else:
    openai.api_key = os.getenv("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")

# --- Page Configuration ---
st.set_page_config(page_title="Bean AI Clone", layout="wide")
st.title("Bean AI Assistant (Streamlit Version)")

# --- Feature 1: File Analysis ---
uploaded_file = st.file_uploader("Upload a PDF for analysis", type=["pdf"])
if uploaded_file:
    try:
        st.write(f"Analyzing `{uploaded_file.name}`...")
        # TODO: Add your real PDF analysis logic here
        st.success("File analysis complete!")
    except Exception as e:
        st.error(f"Error analyzing file: {e}")

# --- Feature 2: Image Generation ---
st.subheader("🖼️ Image Generation")
prompt = st.text_input("Enter a prompt to generate an image")
if st.button("Generate Image"):
    if prompt:
        try:
            with st.spinner("Generating your image..."):
                # Call OpenAI image generation API (example with DALL·E)
                response = openai.Image.create(
                    prompt=prompt,
                    n=1,
                    size="512x512"
                )
                image_url = response['data'][0]['url']
                st.image(image_url, caption=prompt)
        except Exception as e:
            st.error(f"Image generation failed: {e}")
    else:
        st.warning("Please enter a prompt.")

# --- Feature 3: AI Chat ---
st.subheader("💬 AI Chat")
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Get user input
chat_prompt = st.chat_input("What is up?")
if chat_prompt:
    st.session_state.messages.append({"role": "user", "content": chat_prompt})
    with st.chat_message("user"):
        st.markdown(chat_prompt)

    try:
        with st.chat_message("assistant"):
            # Example OpenAI ChatCompletion call to get AI response
            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",  # or another model available to you
                messages=st.session_state.messages
            )
            ai_response = response.choices[0].message.content
            st.markdown(ai_response)
        st.session_state.messages.append({"role": "assistant", "content": ai_response})
    except Exception as e:
        st.error(f"Chat request failed: {e}")
