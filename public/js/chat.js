const socket=io()

//Elemens
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')
const $messages=document.querySelector('#messages')

//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML


//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll=()=>{
  //New message element
  const $newMessage=$messages.lastElementChild

  // Height of the last new message
  const newMessageStyles=getComputedStyle($newMessage)
  const newMessageMargin=parseInt(newMessageStyles.marginBottom)
  const newMessageHeight=$newMessage.offsetHeight + newMessageMargin

  //visible height
  const visibleHeight=$messages.offsetHeight

  //Height of Messages container
  const containerHeight=$messages.scrollHeight

  //How far have i scrolled ?
  const scrollOffset=$messages.scrollTop + visibleHeight

  if(containerHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop=$messages.scrollHeight
  }

}
 
socket.on('message',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('locationMessage',(message)=>{
    console.log(message)
    const html=Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
   const html=Mustache.render(sidebarTemplate,{
       room,
       users
   })
   document.querySelector('#sidebar').innerHTML=html  
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')

    const message=e.target.elements.message.value
    socket.emit('sendMessage',message,(err)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value='';
        $messageFormInput.focus()
        if(err){
            return console.log(err)
        }
        console.log('The message was delivered!')
    })
})

$sendLocationButton.addEventListener('click',()=>{
    
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
       console.log(position)
       socket.emit('sendLocation',{
           latitude:position.coords.latitude,
           longitude:position.coords.longitude
       },()=>{
           console.log("Location shared")
           $sendLocationButton.removeAttribute('disabled')
       })
    })

})


socket.emit('join',{username,room},(err)=>{
    if(err){
        alert(err)
        location.href='/'
    }
})