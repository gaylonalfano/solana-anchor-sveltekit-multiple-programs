let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Code
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +1 solana-anchor-sveltekit-multiple-programs
badd +363 solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte
badd +4 solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts
badd +104 term://~/Code/solana-anchor-sveltekit-multiple-programs//30035:/bin/zsh
badd +1 term://~/Code/solana-anchor-sveltekit-multiple-programs//30591:/bin/zsh
badd +0 term://~/Code/solana-anchor-sveltekit-multiple-programs//31089:/bin/zsh
badd +4 solana-anchor-sveltekit-multiple-programs/app/src/stores/polls/polls-store.ts
badd +0 solana-anchor-sveltekit-multiple-programs/app/src/stores/polls/poll-store.ts
badd +0 term://~/Code/solana-anchor-sveltekit-multiple-programs//33966:/bin/zsh
badd +62 solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pollNumber].svelte
badd +71 solana-anchor-sveltekit-multiple-programs/NetrwTreeListing
badd +7 solana-anchor-sveltekit-multiple-programs/app/src/models/polls-types.ts
badd +0 solana-anchor-sveltekit-multiple-programs/app/src/routes/mint.ts
badd +1 solana-anchor-sveltekit-multiple-programs/app/src/stores/mint
badd +0 solana-anchor-sveltekit-multiple-programs/app/src/stores/mint/mint-store.ts
badd +1 solana-anchor-sveltekit-multiple-programs/app/src/routes/basics.svelte
badd +9 solana-anchor-sveltekit-multiple-programs/app/src/routes/index.svelte
badd +26 solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/custom_program.rs
badd +19 solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/poll.rs
badd +4 solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_poll.rs
badd +43 solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/lib.rs
badd +0 solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_vote.rs
badd +0 solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/profile.rs
argglobal
%argdel
$argadd solana-anchor-sveltekit-multiple-programs
set stal=2
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
edit solana-anchor-sveltekit-multiple-programs/NetrwTreeListing
argglobal
balt solana-anchor-sveltekit-multiple-programs/NetrwTreeListing
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 71 - ((52 * winheight(0) + 31) / 63)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 71
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/profile.rs
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
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 103 + 103) / 207)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 103 + 103) / 207)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_poll.rs
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 18 - ((17 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 18
normal! 046|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/poll.rs", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/poll.rs | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/poll.rs | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/poll.rs
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_poll.rs
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 33 - ((22 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 33
normal! 038|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_vote.rs", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_vote.rs | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_vote.rs | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_vote.rs
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_poll.rs
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 28 - ((12 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 28
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/custom_program.rs", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/custom_program.rs | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/custom_program.rs | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/state/custom_program.rs
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/lib.rs
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 23 - ((21 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 23
normal! 038|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 103 + 103) / 207)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 103 + 103) / 207)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/index.svelte
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/NetrwTreeListing
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 13 - ((12 * winheight(0) + 31) / 63)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 13
normal! 033|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte
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
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 363 - ((42 * winheight(0) + 31) / 63)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 363
normal! 033|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 41 - ((40 * winheight(0) + 31) / 63)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 41
normal! 013|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
exe 'vert 1resize ' . ((&columns * 103 + 103) / 207)
exe 'vert 2resize ' . ((&columns * 103 + 103) / 207)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/\[pollNumber].svelte
argglobal
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 62 - ((30 * winheight(0) + 31) / 63)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 62
normal! 03|
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
tabnext
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
split
1wincmd k
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
wincmd w
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
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 101 + 103) / 207)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 105 + 103) / 207)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 101 + 103) / 207)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 105 + 103) / 207)
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//31089:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//31089:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//31089:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//31089:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//30591:/bin/zsh
setlocal fdm=manual
setlocal fde=0
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
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//30591:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//30591:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//30591:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//30591:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//30035:/bin/zsh
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 711 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 711
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//33966:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//33966:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//33966:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//33966:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//30035:/bin/zsh
setlocal fdm=manual
setlocal fde=0
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
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//30035:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//30035:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//30035:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//30035:/bin/zsh
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/app/src/routes/polls/index.svelte
setlocal fdm=manual
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 772 - ((30 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 772
normal! 0
lcd ~/Code/solana-anchor-sveltekit-multiple-programs
wincmd w
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 101 + 103) / 207)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 105 + 103) / 207)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 101 + 103) / 207)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 105 + 103) / 207)
tabnext 4
set stal=1
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
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
