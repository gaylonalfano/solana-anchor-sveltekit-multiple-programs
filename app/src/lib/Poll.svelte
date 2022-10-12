<script lang="ts">

  // FIXME
  // Q: Do I need to have all variables come in?
  // U: When iterate over $pollsStore, I get the following typeof (below).
  // So, I can't seem to simply {...poll} the Poll Object. I may
  // need to do some sort of type transformation beforehand.
	export let authority: string, // object
    pollNumber: number, // object
		isActive: boolean, // boolean
		optionADisplayLabel: string, // string
    optionBDisplayLabel: string, // string
    optionACount: number, // object
    optionBCount: number, // object
    voteCount: number, // object
    bump: number; // number

</script>

<div class="card w-96 bg-neutral text-neutral-content">
  <div class="card-body items-center text-center">
    <h2 class="card-title">{optionADisplayLabel} vs. {optionBDisplayLabel}</h2>
    <p>Votooooor #:{pollNumber} has {voteCount} total votes!</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">{optionADisplayLabel}</button>
      <button class="btn btn-ghost">{optionBDisplayLabel}</button>
    </div>
  </div>
</div>
