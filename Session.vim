let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Code/solana-anchor-sveltekit-multiple-programs
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +10 tests/non-custodial-escrow.ts
badd +177 programs/non-custodial-escrow/src/lib.rs
badd +10022 term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh
badd +1398 term://~/Code/solana-anchor-sveltekit-multiple-programs//89415:/bin/zsh
badd +423 term://~/Code/solana-anchor-sveltekit-multiple-programs//89967:/bin/zsh
badd +10027 term://~/Code/solana-anchor-sveltekit-multiple-programs//90519:/bin/zsh
badd +257 tests/onchain-voting.ts
badd +75 app/src/routes/escrow/__layout.svelte
badd +622 app/src/routes/polls/index.svelte
badd +87 app/src/routes/escrow/index.svelte
badd +17 app/node_modules/@svelte-on-solana/wallet-adapter-anchor/AnchorConnectionProvider.svelte.d.ts
badd +9 app/node_modules/@svelte-on-solana/wallet-adapter-anchor/workSpace.d.ts
badd +36 app/node_modules/@svelte-on-solana/wallet-adapter-core/lib/esm/walletStore.d.ts
badd +1 Anchor.toml
badd +60 app/src/stores/escrow/tokens-store.ts
badd +16 app/src/stores/balance.ts
badd +22 app/src/helpers/escrow/constants.ts
badd +33 app/src/lib/SendTransaction.svelte
badd +6 app/src/stores/polls/custom-program-store.ts
badd +21 app/src/stores/escrow/custom-program-store.ts
badd +3 app/src/models/escrow-types.ts
badd +4 app/src/models/polls-types.ts
badd +1 app/src/stores/escrow/seller-store.ts
badd +16 app/src/stores/escrow/user-store.ts
badd +1 app/src/routes/polls/\[pda].svelte
badd +9 app/src/stores/escrow/buyer-store.ts
badd +17 app/src/stores/escrow/setup-store.ts
badd +25 app/src/stores/escrow/escrow-store.ts
badd +368 app/src/routes/escrow/\[pda].svelte
badd +44 app/src/stores/polls/polls-store.ts
badd +84 app/src/stores/escrow/escrows-store.ts
badd +15 app/src/lib/Poll.svelte
badd +12 app/src/lib/Escrow.svelte
badd +30 app/src/routes/polls/__layout.svelte
badd +11 app/src/routes/__layout.svelte
badd +394 app/src/helpers/polls/getAllProgramAccounts.ts
argglobal
%argdel
$argadd .
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
edit app/src/stores/escrow/escrows-store.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 81 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 82 + 82) / 164)
argglobal
balt app/src/stores/escrow/escrow-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal nofen
silent! normal! zE
let &fdl = &fdl
let s:l = 93 - ((60 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 93
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("app/src/stores/escrow/escrow-store.ts", ":p")) | buffer app/src/stores/escrow/escrow-store.ts | else | edit app/src/stores/escrow/escrow-store.ts | endif
if &buftype ==# 'terminal'
  silent file app/src/stores/escrow/escrow-store.ts
endif
balt app/src/stores/escrow/escrows-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 25 - ((24 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 25
normal! 0
wincmd w
2wincmd w
exe 'vert 1resize ' . ((&columns * 81 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 82 + 82) / 164)
tabnext
edit app/src/routes/escrow/index.svelte
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 82 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
argglobal
balt app/src/stores/escrow/custom-program-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 87 - ((49 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 87
normal! 064|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs/app
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/app/src/lib/Escrow.svelte", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/lib/Escrow.svelte | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/lib/Escrow.svelte | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/lib/Escrow.svelte
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow/index.svelte
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 12 - ((11 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 12
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs/app
wincmd w
exe 'vert 1resize ' . ((&columns * 82 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow/\[pda].svelte
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 82 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/escrow/escrows-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 368 - ((47 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 368
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow/\[pda].svelte", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow/\[pda].svelte | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow/\[pda].svelte | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow/\[pda].svelte
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/stores/escrow/user-store.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 279 - ((50 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 279
normal! 0
wincmd w
exe 'vert 1resize ' . ((&columns * 82 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 82 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 177 - ((25 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 177
normal! 020|
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 10 - ((9 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 10
normal! 014|
wincmd w
exe 'vert 1resize ' . ((&columns * 82 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/lib/Poll.svelte
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 82 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 15 - ((8 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 15
normal! 012|
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pda].svelte
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/__layout.svelte
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal nofen
silent! normal! zE
1,470fold
let &fdl = &fdl
let s:l = 42 - ((41 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 42
normal! 022|
wincmd w
exe 'vert 1resize ' . ((&columns * 82 + 82) / 164)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
tabnext
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd _ | wincmd |
split
1wincmd k
wincmd w
wincmd w
wincmd _ | wincmd |
split
1wincmd k
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 81 + 82) / 164)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 82 + 82) / 164)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 82 + 82) / 164)
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 10031 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 10031
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//90519:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//90519:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//90519:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//90519:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 10013 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 10013
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//89415:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//89415:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//89415:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//89415:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1379 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1379
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//89967:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//89967:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//89967:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//89967:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//89415:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 423 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 423
normal! 0
wincmd w
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 81 + 82) / 164)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 81 + 82) / 164)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 82 + 82) / 164)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 82 + 82) / 164)
tabnext 1
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0 && getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20
let &shortmess = s:shortmess_save
let &winminheight = s:save_winminheight
let &winminwidth = s:save_winminwidth
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
set hlsearch
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
