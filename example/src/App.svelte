<script lang="ts">
  import { Macy } from "svelte-macy";
  import type { MacyInstance } from "svelte-macy";

  let macy: MacyInstance;
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
  .card {
    box-sizing: border-box;
    padding: 10px;
    border: 2px solid black;
  }
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  <Macy
    bind:macy
    options={{
      columns: 6,
      margin: 10,
    }}
  >
    <div class="card">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Odit maiores
      voluptatibus dolore. Illo molestias placeat ex. Magni earum totam nihil
      quod accusamus illum quaerat iste quidem officia! Illo, dolorem. Quae!
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid nam
      mollitia esse consequuntur numquam corrupti animi illum, corporis earum
      nulla modi fuga fugit facilis quo odit quam accusamus libero architecto
      reiciendis laboriosam explicabo? Tempore id eos molestiae aspernatur hic
      eveniet quibusdam! Beatae expedita debitis provident quod officiis, aut
      quidem natus?
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Recusandae,
      enim.
    </div>
    <div class="card">
      Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ab quia quo nam
      odit maxime minus ut nemo, doloribus eius beatae! Libero reprehenderit
      provident similique expedita, esse autem veniam deleniti numquam molestias
      nemo qui eaque at non tenetur magni sit. Blanditiis corporis hic soluta
      facere aliquam temporibus id consequatur nihil voluptatum. Doloremque
      nulla ipsa sunt eligendi tenetur maxime laudantium unde vel nobis corporis
      corrupti dolor alias, molestiae eum enim reprehenderit! Sunt voluptas ea
      quisquam rerum voluptatum, omnis ipsa quia at nulla. Ducimus eos deserunt
      eligendi, consectetur provident molestias vel quo adipisci sit? Eligendi
      sint similique praesentium repellendus. Sed dolore fuga assumenda.
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste, deserunt
      voluptatibus vero, nostrum dolor animi alias exercitationem delectus nemo
      rem atque, praesentium eius earum distinctio consequatur consequuntur
      eveniet id sit iusto quidem. Sunt.
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus nam
      harum non quaerat, aliquam consequatur sint corrupti voluptates nobis, at
      nesciunt ducimus. Voluptatum quod, officia itaque in vitae aliquam minus
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Odit maiores
      voluptatibus dolore. Illo molestias placeat ex. Magni earum totam nihil
      quod accusamus illum quaerat iste quidem officia! Illo, dolorem. Quae!
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid nam
      mollitia esse consequuntur numquam corrupti animi illum, corporis earum
      nulla modi fuga fugit facilis quo odit quam accusamus libero architecto
      reiciendis laboriosam explicabo? Tempore id eos molestiae aspernatur hic
      eveniet quibusdam! Beatae expedita debitis provident quod officiis, aut
      quidem natus?
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Recusandae,
      enim.
    </div>
    <div class="card">
      Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ab quia quo nam
      odit maxime minus ut nemo, doloribus eius beatae! Libero reprehenderit
      provident similique expedita, esse autem veniam deleniti numquam molestias
      nemo qui eaque at non tenetur magni sit. Blanditiis corporis hic soluta
      facere aliquam temporibus id consequatur nihil voluptatum. Doloremque
      nulla ipsa sunt eligendi tenetur maxime laudantium unde vel nobis corporis
      corrupti dolor alias, molestiae eum enim reprehenderit! Sunt voluptas ea
      quisquam rerum voluptatum, omnis ipsa quia at nulla. Ducimus eos deserunt
      eligendi, consectetur provident molestias vel quo adipisci sit? Eligendi
      sint similique praesentium repellendus. Sed dolore fuga assumenda.
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste, deserunt
      voluptatibus vero, nostrum dolor animi alias exercitationem delectus nemo
      rem atque, praesentium eius earum distinctio consequatur consequuntur
      eveniet id sit iusto quidem. Sunt.
    </div>
    <div class="card">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus nam
      harum non quaerat, aliquam consequatur sint corrupti voluptates nobis, at
      nesciunt ducimus. Voluptatum quod, officia itaque in vitae aliquam minus
    </div>
  </Macy>
</main>
