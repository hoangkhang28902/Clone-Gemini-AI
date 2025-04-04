const promptForm =document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const chatsContainer =document.querySelector(".chats-container");
const container =document.querySelector(".container");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");

const fileInput =document.querySelector("#file-input");

const userData = {message: "",file: {}};

let typingInterval,controller;
const chatHistory = [];

const API_KEY="AIzaSyDT6cUClbBLLIkQZSUrfnIic_4OnpzW9OY";
const API_URL= `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;


const scrollToBottom = () => container.scrollTo({top:container.scrollHeight, behavior: "smooth"});
// func to create mess element

const createMsgElement = (content,...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML=content;
    return div;
}

const typingEffect = (text, textElement, botMsgDiv) =>
{
    textElement.textContent="";
    const words = text.split(" ");
    let wordIndex = 0;
    
    typingInterval = setInterval(() =>
    {
        if(wordIndex <words.length)
        {
            textElement.textContent += (wordIndex === 0 ? "" : " ")+ words[wordIndex++];
           
           
            scrollToBottom();
        }
        else
        {
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
        }
    },40);
}
// AI Gen

const generateRespone = async (botMsgDiv) =>{
    const textElement=botMsgDiv.querySelector(".message-text");
    controller = new AbortController();

    chatHistory.push({
        role: "user",
        parts : [{text:userData.message}, ...(userData.file.data ? [{inline_data: (({fileName,isImage, ...rest}) => rest  
        )(userData.file)}]:[])]
    });
    try{
        const response = await fetch(API_URL,{
            method: "POST",
            headers:{"Content-Type": "application/json"
        },  
            body:JSON.stringify({contents: chatHistory}),
            signal: controller.signal
        }

    );
    const data = await response.json();
    if(!response.ok) throw new Error(data.error.message);
    // console.log(data);
    const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
    typingEffect(responseText,textElement,botMsgDiv);    
    chatHistory.push({role: "user", parts:[{ text: responseText}]});


} catch(error){
    textElement.style.color="#d62939";
    textElement.textContent = error.name === "AbortError" ? "Response generation stopped." :error.message;
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");    

}
    finally{
        userData.file={};
    }
}


// Handle the form submission

const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = promptInput.value.trim();
   
    if (!userMessage || document.body.classList.contains("bot-responding")) return;
    promptInput.value="";
    userData.message= userMessage;
    document.body.classList.add("bot-responding","chats-active");
    fileUploadWrapper.classList.remove("active", "img-attached" , "file-attached");
    // console.log(userMessage);
    const userMsgHTML =` <p class="message-text"></p>
    ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}"class="img-attachment"/>`:`<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`):""}
    `;
    const userMsgDiv = createMsgElement(userMsgHTML,"user-message");
    userMsgDiv.querySelector(".message-text").textContent=userMessage;
    chatsContainer.appendChild(userMsgDiv);
    scrollToBottom();

    setTimeout(()=>{
        const botMsgHTML =`  <img src="gemini.svg" class="avata"><p class="message-text">Just a sec...</p>`;
        const botMsgDiv = createMsgElement(botMsgHTML,"bot-message","loading");
        chatsContainer.appendChild(botMsgDiv);
        generateRespone(botMsgDiv);
        scrollToBottom();
    },600)
}

fileInput.addEventListener("change",()=>{
    const file = fileInput.files[0];
    if (!file) return;
    
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload =(e) => {
        fileInput.value = "";
        const base64String =e.target.result.split(",")[1];
        fileUploadWrapper.querySelector(".file-review").src = e.target.result;
        fileUploadWrapper.classList.add("active", isImage ? "img-attached" : "file-attached");
        userData.file = { fileName : file.name, data: base64String, mime_type:file.type,isImage};
    }
});


document.querySelector("#cancel-file-btn").addEventListener("click",()=>{
    userData.file= {};
    fileUploadWrapper.classList.remove("active", "img-attached" , "file-attached");
});

document.querySelector("#top-respone-btn").addEventListener("click",()=>{
    userData.file= {};
    controller.abort();
    clearInterval(typingInterval);
    chatsContainer.querySelector(".bot-message.loading").classList.remove("loading");
    document.body.classList.remove("bot-responding");
});


document.querySelector("#delete-chats-btn").addEventListener("click",()=>{
   chatHistory.length= 0;
   chatsContainer.innerHTML= "";
   document.body.classList.remove("bot-responding", "chats-active");
});

themeToggle.addEventListener("click",() =>{
   const isLightTheme = document.body.classList.toggle("light-theme");
    localStorage.setItem("themeColor",isLightTheme ? "light_mode" : "dark_more");
    themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});
document.addEventListener("click",({target})=>
    {
        const wrapper = document.querySelector(".prompt-wrapper");
        const shouldHide = target.classList.contains("prompt-input") || (wrapper.classList.contains("hide-controls") && (target.id === "add-file-btn" || target.id === "top-respone-btn"));
        wrapper.classList.toggle("hide-controls",shouldHide);
    });

document.querySelectorAll(".suggestions-item").forEach(item =>
{
    item.addEventListener("click",()=>
    {
        promptInput.value = item.querySelector(".text").textContent;
        promptForm.dispatchEvent(new Event("submit"));
    });
}
)

const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme",isLightTheme);
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";

promptForm.addEventListener("submit",handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click",()=> fileInput.click());

