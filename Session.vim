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
badd +8 tests/non-custodial-escrow.ts
badd +71 programs/non-custodial-escrow/src/lib.rs
badd +1 term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh
badd +1 term://~/Code/solana-anchor-sveltekit-multiple-programs//89415:/bin/zsh
badd +0 term://~/Code/solana-anchor-sveltekit-multiple-programs//89967:/bin/zsh
badd +0 term://~/Code/solana-anchor-sveltekit-multiple-programs//90519:/bin/zsh
argglobal
%argdel
$argadd .
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
edit tests/non-custodial-escrow.ts
argglobal
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
let s:l = 8 - ((7 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 8
normal! 0
tabnext
edit programs/non-custodial-escrow/src/lib.rs
argglobal
balt tests/non-custodial-escrow.ts
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
let s:l = 71 - ((8 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 71
normal! 0
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
exe 'vert 1resize ' . ((&columns * 86 + 86) / 173)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 86 + 86) / 173)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 86 + 86) / 173)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 86 + 86) / 173)
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//88933:/bin/zsh
endif
balt programs/non-custodial-escrow/src/lib.rs
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1 - ((0 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
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
let s:l = 1 - ((0 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
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
let s:l = 1 - ((0 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
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
let s:l = 1 - ((0 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
2wincmd w
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 86 + 86) / 173)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 86 + 86) / 173)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 86 + 86) / 173)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 86 + 86) / 173)
tabnext 3
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
nohlsearch
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
