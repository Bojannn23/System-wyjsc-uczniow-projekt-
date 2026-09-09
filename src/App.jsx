import './App.css'
import '../node_modules/bootstrap'

function Header({children}) {
  return(
    <header>{children}</header>
  )
}
  

function Btn({children}) {
  return(
    <button>{children}</button>
  )
}

function Card({children}) {
  return(
    <div style={{
      width: "400px",
      // height: "400px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      boxShadow: "0 5px 7px gray",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "30px"
    }}>{children}</div>
  )
}


function App() {
  return(
    <> 
      <Header>
        <h1>Projekt WEB 2.0</h1>
      </Header>
      <Btn>
        skibidi
      </Btn>
      <main>
        <Card>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Corrupti sapiente necessitatibus recusandae in sequi laborum mollitia nesciunt quam similique doloremque. Totam voluptates voluptatum ad ea tempora eveniet dolorem ipsam exercitationem!
        </Card>
        <Card>
          <Btn>
            Mama mia
          </Btn>
        </Card>
      </main>
    </>
  )
  
}

export default App
