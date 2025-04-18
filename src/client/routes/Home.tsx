import { FunctionalComponent } from "preact"
import { useEffect, useState } from "preact/hooks"
import { SerializedEntityDecl } from "../../schema/index.js"
import { getAllEntities } from "../api.js"

export const Home: FunctionalComponent = () => {
  const [entities, setEntities] = useState<SerializedEntityDecl[]>([])

  useEffect(() => {
    console.log("Fetching entities...")
    getAllEntities()
      .then(data => {
        console.log("Entities fetched: %d", data.length)
        setEntities(data.slice().sort((a, b) => a.name.localeCompare(b.name)))
      })
      .catch(error => {
        console.error("Error fetching entities:", error)
      })
  }, [])

  return (
    <>
      <header>
        <nav>
          <a href="/">Home</a>
        </nav>
      </header>
      <main>
        <h1>TSONDB</h1>
        <ul>
          {entities.map(entity => (
            <li key={entity.name}>
              <a href={`/entities/${entity.name}`}>
                <h2>{entity.name}</h2>
                <p>{entity.comment}</p>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
