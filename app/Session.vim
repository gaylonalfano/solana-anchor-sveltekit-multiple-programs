let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Code/solana-anchor-sveltekit-multiple-programs/app
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +148 ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts
badd +557 src/routes/escrow.svelte
badd +533 src/routes/polls/index.svelte
badd +24 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59204:/bin/zsh
badd +1911 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59684:/bin/zsh
badd +5536 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60215:/bin/zsh
badd +207 term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60778:/bin/zsh
badd +6 src/routes/__layout.svelte
badd +401 src/helpers/polls/getAllProgramAccounts.ts
badd +5 ~/Code/solana-anchor-sveltekit-multiple-programs/Anchor.toml
badd +294 ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
badd +46 ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/poll.rs
badd +588 ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts
badd +1 src/models/polls-types.ts
badd +0 src/idl/non_custodial_escrow.ts
badd +0 src/helpers/polls/constants.ts
badd +20 src/helpers/escrow/constants.ts
badd +3150 node_modules/@solana/web3.js/lib/index.d.ts
argglobal
%argdel
$argadd .
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
edit src/routes/escrow.svelte
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
exe 'vert 1resize ' . ((&columns * 75 + 75) / 150)
exe 'vert 2resize ' . ((&columns * 74 + 75) / 150)
argglobal
balt node_modules/@solana/web3.js/lib/index.d.ts
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
let s:l = 342 - ((15 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 342
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
endif
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
let s:l = 239 - ((49 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 239
normal! 0
wincmd w
exe 'vert 1resize ' . ((&columns * 75 + 75) / 150)
exe 'vert 2resize ' . ((&columns * 74 + 75) / 150)
tabnext
edit src/helpers/escrow/constants.ts
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
exe 'vert 1resize ' . ((&columns * 74 + 75) / 150)
exe 'vert 2resize ' . ((&columns * 75 + 75) / 150)
argglobal
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
let s:l = 22 - ((21 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 22
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
endif
balt src/helpers/escrow/constants.ts
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
let s:l = 294 - ((42 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 294
normal! 0
wincmd w
exe 'vert 1resize ' . ((&columns * 74 + 75) / 150)
exe 'vert 2resize ' . ((&columns * 75 + 75) / 150)
tabnext
edit src/helpers/polls/getAllProgramAccounts.ts
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
exe 'vert 1resize ' . ((&columns * 75 + 75) / 150)
exe 'vert 2resize ' . ((&columns * 74 + 75) / 150)
argglobal
balt src/routes/__layout.svelte
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
let s:l = 401 - ((54 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 401
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs/app
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts
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
let s:l = 71 - ((30 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 71
normal! 017|
wincmd w
exe 'vert 1resize ' . ((&columns * 75 + 75) / 150)
exe 'vert 2resize ' . ((&columns * 74 + 75) / 150)
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
exe 'vert 1resize ' . ((&columns * 74 + 75) / 150)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 74 + 75) / 150)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 75 + 75) / 150)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 75 + 75) / 150)
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59204:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59204:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59204:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59204:/bin/zsh
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/escrow.svelte
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 26 - ((15 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 26
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60215:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60215:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60215:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60215:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59204:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 5567 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 5567
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59684:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59684:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59684:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59684:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59204:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 3209 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 3209
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60778:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60778:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60778:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs/app//60778:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs/app//59684:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 207 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 207
normal! 054|
wincmd w
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 74 + 75) / 150)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 74 + 75) / 150)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 75 + 75) / 150)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 75 + 75) / 150)
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
